const express = require('express');
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

app.post('/api/login', (req, res) => {
  require('./routes/login')(req, res);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});