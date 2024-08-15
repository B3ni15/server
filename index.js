const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  })

  const page = await browser.newPage();

  await page.goto('https://idp.e-kreta.hu/Account/Login?ReturnUrl=/connect/authorize/callback?prompt%3Dlogin%26nonce%3DwylCrqT4oN6PPgQn2yQB0euKei9nJeZ6_ffJ-VpSKZU%26response_type%3Dcode%26code_challenge_method%3DS256%26scope%3Dopenid%2520email%2520offline_access%2520kreta-ellenorzo-webapi.public%2520kreta-eugyintezes-webapi.public%2520kreta-fileservice-webapi.public%2520kreta-mobile-global-webapi.public%2520kreta-dkt-webapi.public%2520kreta-ier-webapi.public%26code_challenge%3DHByZRRnPGb-Ko_wTI7ibIba1HQ6lor0ws4bcgReuYSQ%26redirect_uri%3Dhttps%253A%252F%252Fmobil.e-kreta.hu%252Fellenorzo-student%252Fprod%252Foauthredirect%26client_id%3Dkreta-ellenorzo-student-mobile-ios%26state%3Drefilc_student_mobile%26suppressed_prompt%3Dlogin');

  await page.waitForSelector('#UserName'); 

  await page.type('#UserName', 'Username');
  await page.type('#Password', 'Password');
  await page.type('input[data-bs-toggle="dropdown"]', 'Institute');

  setTimeout(async () => {
    await page.click('#submit-btn');

    await page.waitForNavigation();
  
    const url = page.url();
    console.log('Redirected URL:', url);
  
    const urlParams = new URLSearchParams(new URL(url).search);
    const code = urlParams.get('code');
    console.log('Code:', code);
    
    await getAccessToken(code);

    await browser.close();
  }, 2000);
})();

async function getAccessToken(code) {
  const response = await axios.post('https://idp.e-kreta.hu/connect/token', {
    grant_type: 'authorization_code',
    code: code,
    client_id: 'kreta-ellenorzo-student-mobile-ios',
    redirect_uri: 'https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect',
    code_verifier: 'DSpuqj_HhDX4wzQIbtn8lr8NLE5wEi1iVLMtMK0jY6c',
  },
  {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
      'User-Agent': 'eKretaStudent/264745 CFNetwork/1494.0.7 Darwin/23.4.0',
    }
  });
  console.log('Access Token:', response.data.access_token);
  return response.data.access_token;
}