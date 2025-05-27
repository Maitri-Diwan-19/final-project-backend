import dotenv from 'dotenv';

dotenv.config();

//  Environment variables
const config = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  SALT_ROUND: process.env.SALT_ROUND,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES,

  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES,
};

//CORS options

export const corsOptions = {
  origin: '*',
};

export default config;
