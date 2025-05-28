import config from './constants/config.js';
import app from './app.js';

const port = config.PORT || 2000;

app.listen(port, () => {
  console.log(`server is running on: http://localhost:${port}`);
});
