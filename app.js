import express from 'express';
import cors from 'cors';
import { corsOptions } from './constants/config.js';

const app = express();

app.use(cors(corsOptions));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to Express App');
});

export default app;
