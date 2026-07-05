// utils/tokens.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto")

// --------------------------------------

function generateAccessToken(user) {
  console.log("ACCESS:", process.env.ACCESS_TOKEN_SECRET);
  return jwt.sign(
    { id: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "30m" } // short-lived
  );
}

// --------------------------------------

function generateRefreshToken(user) {
  console.log("REFRESH:", process.env.REFRESH_TOKEN_SECRET);
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "30d" } // long-lived
  );
}
// --------------------------------------

function generateResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex") // اللي هيتبعت في الإيميل
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex") // اللي هيتخزن في الداتابيز
  return { rawToken, hashedToken }
}
// --------------------------------------

const cookieOptions = {
  refresh: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 30
  }
}

module.exports = { 
  generateAccessToken, 
  generateRefreshToken, 
  generateResetToken, 
  cookieOptions 
};