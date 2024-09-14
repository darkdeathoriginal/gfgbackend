const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

function generateSessionToken(payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  return token;
}
function validateSessionToken(req, res, next) {
  let token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  if(token.startsWith('Bearer ')){
    token = token.slice(7, token.length);
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    } else {
      req.user = decoded;
      next();
    }
  });
}

module.exports = {
  generateSessionToken,
  validateSessionToken,
};
