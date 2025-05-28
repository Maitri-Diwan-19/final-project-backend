import express from 'express';
import cors from 'cors';
import { corsOptions } from './constants/config.js';
import authRoute from './routes/authroute.js';
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoute);

app.get('/', (req, res) => {
  res.send('Welcome to Express App');
});
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({ message: 'something went wrong' });
});
export default app;
