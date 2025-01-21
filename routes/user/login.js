const axios = require('axios');
const puppeteer = require('puppeteer');

module.exports = async function (req, res) {
  const { USERNAME, PASSWORD, INSTITUTE } = req.body;

  console.log(`[INFO] Received request with body: ${JSON.stringify(req.body)}`);

  if (!USERNAME || !PASSWORD || !INSTITUTE) {
    console.error(`[ERROR] Missing parameters: ${JSON.stringify({ USERNAME, PASSWORD, INSTITUTE })}`);
    return res.status(400).json({
      success: false,
      message: 'Please provide USERNAME, PASSWORD, and INSTITUTE in the request body.',
    });
  }

  try {
    console.log('[INFO] Launching Puppeteer browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--platform', 'linux'],
    });

    const page = await browser.newPage();
    console.log('[INFO] Navigating to login page...');
    await page.goto(
      'https://idp.e-kreta.hu/Account/Login?ReturnUrl=/connect/authorize/callback?prompt%3Dlogin%26nonce%3DwylCrqT4oN6PPgQn2yQB0euKei9nJeZ6_ffJ-VpSKZU%26response_type%3Dcode%26code_challenge_method%3DS256%26scope%3Dopenid%2520email%2520offline_access%2520kreta-ellenorzo-webapi.public%2520kreta-eugyintezes-webapi.public%2520kreta-fileservice-webapi.public%2520kreta-mobile-global-webapi.public%2520kreta-dkt-webapi.public%2520kreta-ier-webapi.public%26code_challenge%3DHByZRRnPGb-Ko_wTI7ibIba1HQ6lor0ws4bcgReuYSQ%26redirect_uri%3Dhttps%253A%252F%252Fmobil.e-kreta.hu%252Fellenorzo-student%252Fprod%252Foauthredirect%26client_id%3Dkreta-ellenorzo-student-mobile-ios%26state%3Drefilc_student_mobile%26suppressed_prompt%3Dlogin'
    );

    console.log('[INFO] Waiting for username input field...');
    await page.waitForSelector('#UserName', { timeout: 10000 });

    console.log('[INFO] Filling in the login form...');
    await page.type('#UserName', USERNAME);
    await page.type('#Password', PASSWORD);
    await page.type('input[data-bs-toggle="dropdown"]', INSTITUTE);

    console.log('[INFO] Clicking submit button...');
    await Promise.all([
      page.click('#submit-btn'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
    ]);

    console.log('[INFO] Checking for potential CAPTCHA...');
    const captchaDetected = await page.$('#recaptcha');
    if (captchaDetected) {
      console.warn('[WARNING] CAPTCHA detected, manual input required.');
      await browser.close();
      return res.status(500).json({
        success: false,
        message: 'CAPTCHA detected. Please complete it manually.',
      });
    }

    console.log('[INFO] Extracting redirected URL...');
    const redirectedURL = page.url();
    console.log(`[INFO] Redirected to URL: ${redirectedURL}`);

    if (!redirectedURL.includes('code=')) {
      throw new Error('Authorization code not found in the redirected URL.');
    }

    console.log('[INFO] Extracting authorization code...');
    const code = new URL(redirectedURL).searchParams.get('code');
    console.log(`[INFO] Authorization code extracted: ${code}`);

    console.log('[INFO] Requesting access token...');
    const accessToken = await getAccessToken(code);

    console.log('[INFO] Access token received successfully.');
    res.status(200).json({
      success: true,
      message: 'Successfully logged in.',
      data: accessToken,
    });

    await browser.close();
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login.',
      error: error.message,
    });
  }
};

async function getAccessToken(code) {
  try {
    console.log('[INFO] Requesting access token from API...');
    const response = await axios.post(
      'https://idp.e-kreta.hu/connect/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: 'kreta-ellenorzo-student-mobile-ios',
        redirect_uri: 'https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect',
        code_verifier: 'DSpuqj_HhDX4wzQIbtn8lr8NLE5wEi1iVLMtMK0jY6c',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'eKretaStudent/264745 CFNetwork/1494.0.7 Darwin/23.4.0',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('[ERROR] Failed to get access token:', error.message);
    throw new Error('Failed to get access token.');
  }
}