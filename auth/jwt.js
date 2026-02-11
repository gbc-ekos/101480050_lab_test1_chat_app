import jwt from 'jsonwebtoken';

export function sign(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verify(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}