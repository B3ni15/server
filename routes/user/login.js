const axios = require('axios');
const puppeteer = require('puppeteer');

module.exports = async function (req, res) {
    const { USERNAME, PASSWORD, INSTITUTE } = req.body;

    if (!USERNAME || !PASSWORD || !INSTITUTE) {
      return res.status(400).json({
        success: false,
        message: 'Please provide USERNAME, PASSWORD, and INSTITUTE in the query string.',
      });
    }
  
    (async () => {
      try {
        const browser = await puppeteer.launch({
          headless: false,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ],
        });
  
        const page = await browser.newPage();
  
        await page.goto('https://idp.e-kreta.hu/Account/Login?ReturnUrl=/connect/authorize/callback?prompt%3Dlogin%26nonce%3DwylCrqT4oN6PPgQn2yQB0euKei9nJeZ6_ffJ-VpSKZU%26response_type%3Dcode%26code_challenge_method%3DS256%26scope%3Dopenid%2520email%2520offline_access%2520kreta-ellenorzo-webapi.public%2520kreta-eugyintezes-webapi.public%2520kreta-fileservice-webapi.public%2520kreta-mobile-global-webapi.public%2520kreta-dkt-webapi.public%2520kreta-ier-webapi.public%26code_challenge%3DHByZRRnPGb-Ko_wTI7ibIba1HQ6lor0ws4bcgReuYSQ%26redirect_uri%3Dhttps%253A%252F%252Fmobil.e-kreta.hu%252Fellenorzo-student%252Fprod%252Foauthredirect%26client_id%3Dkreta-ellenorzo-student-mobile-ios%26state%3Drefilc_student_mobile%26suppressed_prompt%3Dlogin');
  
        await page.waitForSelector('#UserName');
  
        if (USERNAME) {
          await page.type('#UserName', USERNAME);
        } else {
          throw new Error('USERNAME is not provided or is invalid.');
        }
  
        if (PASSWORD) {
          await page.type('#Password', PASSWORD);
        } else {
          throw new Error('PASSWORD is not provided or is invalid.');
        }
  
        if (INSTITUTE) {
          await page.type('input[data-bs-toggle="dropdown"]', INSTITUTE);
        } else {
          throw new Error('INSTITUTE is not provided or is invalid.');
        }
  
        await new Promise(r => setTimeout(r, 2000));
  
        await page.click('#submit-btn');
  
        await new Promise(r => setTimeout(r, 2000));
        const url = page.url();
        //console.log('Redirected URL:', url);
  
        const urlParams = new URLSearchParams(new URL(url).search);
        const code = urlParams.get('code');
        //console.log('Code:', code);
  
        const accessToken = await getAccessToken(code);
        //console.log('Access Token:', accessToken);
  
        res.status(200).json({
          success: true,
          message: 'Successfully logged in.',
          token: accessToken,
        });
  
        await browser.close();
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
          success: false,
          message: 'An error occurred during login.',
          error: error.message,
        });
      }
})();

async function getAccessToken(code) {
    try {
      const response = await axios.post(
        'https://idp.e-kreta.hu/connect/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: 'kreta-ellenorzo-student-mobile-ios',
          redirect_uri: 'https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect',
          code_verifier: 'DSpuqj_HhDX4wzQIbtn8lr8NLE5wEi1iVLMtMK0jY6c',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*',
            'User-Agent': 'eKretaStudent/264745 CFNetwork/1494.0.7 Darwin/23.4.0',
          }
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw new Error('Failed to get access token.');
    }
  }
}