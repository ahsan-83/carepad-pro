const jwt = require("jsonwebtoken");

const SECRET_KEY = "4363b1c8117514b1596fd692e7eb6dee5f70e75168edc14fa02c25a00f142b1f"

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(401);
    }
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
