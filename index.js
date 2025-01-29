const express = require('express');
const axios = require('axios');
const moment = require('moment');
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