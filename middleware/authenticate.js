import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      console.warn('[Auth Middleware] No token found in cookies.');
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('[Auth Middleware Error] Token expired:', error);
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    console.error('[Auth Middleware Error]', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export default authenticate;
