const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./queries');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

app.use(bodyParser.json());

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get('/', (request, response) => {
  response.status(200).json({ info: 'Node.js, Express, and Postgres API' })
});

app.get('/getdata', db.getData);
//app.get('/users/:id', db.getUserById);

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})
