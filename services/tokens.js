require('dotenv').config();
const jwt = require('jsonwebtoken');

function generateAccessToken(user_id) {
    const payload = { user_id: user_id };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN, { expiresIn: process.env.TOKEN_EXPIRY });
    return accessToken;
}

function generateRefreshToken(user_id) {
    const payload = { user_id: user_id };
    const refreshToken = jwt.sign(payload, process.env.ACCESS_REFRESH_TOKEN, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
    return refreshToken;
}

module.exports = { generateAccessToken, generateRefreshToken }