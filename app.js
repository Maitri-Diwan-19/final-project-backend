import express from 'express';
import cors from 'cors';
import authRoute from './routes/authroute.js';
import userroute from './routes/userroute.js';
import postroute from './routes/postroute.js';
import chatroute from './routes/chatroute.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoute);
app.use('/api/user', userroute);
app.use('/api/post', postroute);
app.use('/api/chat', chatroute);

app.get('/', (req, res) => {
  res.send('Welcome to Express App');
});
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({ message: 'something went wrong' });
});
export default app;
