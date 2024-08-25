const express = require('express');
const app = express();
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
const port = 3000;

app.get('/', (req, res) => {
  res.redirect('/api');
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working!',
  });
});

app.use(express.json());

app.post('/api/user/login', (req, res) => {
  require('./routes/user/login')(req, res);
});

app.get('/api/user/info', async (req, res) => {
  require('./routes/user/info')(req, res);
});

app.get('/api/user/orarend', async (req, res) => {
  require('./routes/user/orarend')(req, res);
});

app.get('/api/user/orarend/kep', async (req, res) => {
 require('./routes/user/orarendkep')(req, res);
});

app.get('/api/user/orarend/kep/:id', async (req, res) => {
  const id = req.params.id;
  const path = `/kepek/${id}.png`;

  if (fs.existsSync(__dirname + path)) {
    res.status(200).sendFile(__dirname + path);
  } else {
    res.status(404).send('Not Found');
  }
});

app.get('/api/user/evaluations', async (req, res) => {
  const { TOKEN, INSTITUTE, DATUMTOL, DATUMIG } = req.body;

  if (!TOKEN || !INSTITUTE || !DATUMTOL || !DATUMIG) {
    res.status(400).send("Missing parameters");
    return;
  }

  try {
    const response = await axios.get(`https://${INSTITUTE}.e-kreta.hu/ellenorzo/v3/sajat/Ertekelesek?datumTol=${DATUMTOL}&datumIg=${DATUMIG}`, {
      headers: {
        "Authorization": "Bearer " + TOKEN,
        "User-Agent": "hu.ekreta.tanulo/1.0.5/Android/0/0"
      }
    });
    res.status(200).json(response.data);
    console.log("Evaluations fetched successfully");
  }
  catch (error) {
    res.status(400).json(error);
  }
});

setInterval(() => {
  const mappa = __dirname + '/kepek';

  fs.readdir(mappa, (err, files) => {
    if (err) {
      console.error('Hiba történt a mappa beolvasása során:', err);
      return;
    }

    files.forEach(file => {
      fs.unlink(`${mappa}/${file}`, err => {
        if (err) {
          console.error('Hiba történt a fájl törlése során:', err);
          return;
        }
        console.log('A fájl sikeresen törölve:', file);
      });
    });
  });
}, 30 * 60 * 1000);

function getCurrentMonday() {
  const today = moment();
  const monday = today.day(1);
  return monday.format('YYYY-MM-DD');
}

function getCurrentFriday() {
  const today = moment();
  const friday = today.day(7);
  return friday.format('YYYY-MM-DD');
}

console.log(getCurrentMonday(), getCurrentFriday());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});