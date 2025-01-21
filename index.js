const express = require('express');
const axios = require('axios');
const puppeteer = require('puppeteer');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.redirect('/api');
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working!',
  });
});

app.post('/api/user/login', (req, res) => {
  require('./routes/user/login')(req, res);
});

app.get('/api/user/info', async (req, res) => {
  require('./routes/user/info')(req, res);
});

app.get('/api/user/orarend', async (req, res) => {
  require('./routes/user/orarend')(req, res);
});

app.get('/api/user/evaluations', async (req, res) => {
  const { TOKEN, INSTITUTE, DATUMTOL, DATUMIG } = req.query;

  if (!TOKEN || !INSTITUTE || !DATUMTOL || !DATUMIG) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const response = await axios.get(
      `https://${INSTITUTE}.e-kreta.hu/ellenorzo/v3/sajat/Ertekelesek`,
      {
        params: { datumTol: DATUMTOL, datumIg: DATUMIG },
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'User-Agent': 'hu.ekreta.tanulo/1.0.5/Android/0/0',
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

async function processPuppeteer() {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(
      'https://idp.e-kreta.hu/Account/Login?ReturnUrl=/connect/authorize/callback?prompt=login&response_type=code&client_id=kreta-ellenorzo-student-mobile-ios'
    );

    await page.type('#UserName', process.env.TAJ);
    await page.type('#Password', process.env.PASSWORD);

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await page.click('#submit-btn');
    await page.waitForNavigation();

    const redirectedUrl = page.url();
    const urlParams = new URLSearchParams(new URL(redirectedUrl).search);
    const code = urlParams.get('code');

    if (code) {
      const accessToken = await getAccessToken(code);
      console.log('Access Token:', accessToken);
    }

    await browser.close();
  } catch (error) {
    console.error('Error during Puppeteer process:', error);
  }
}

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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error.message);
    throw error;
  }
}

setInterval(async () => {
  await processPuppeteer();

  const directory = path.join(__dirname, 'kepek');
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }
    files.forEach((file) => {
      fs.unlink(path.join(directory, file), (err) => {
        if (err) {
          console.error('Error deleting file:', file, err);
        } else {
          console.log('File deleted:', file);
        }
      });
    });
  });
}, 30 * 60 * 1000);

function getCurrentMonday() {
  return moment().startOf('isoWeek').format('YYYY-MM-DD');
}

function getCurrentFriday() {
  return moment().endOf('isoWeek').format('YYYY-MM-DD');
}

console.log('Current Monday:', getCurrentMonday(), 'Current Friday:', getCurrentFriday());

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});