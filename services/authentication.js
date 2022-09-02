require('dotenv').config();
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const token = req.headers['authorization']

    if (token == null)
        return res.sendStatus(401);
    else {
        jwt.verify(token, process.env.ACCESS_TOKEN, (err, response) => {
            if (err) {
                if (err.message == 'jwt expired')
                    return res.status(401).json('expired');
                else
                    return res.sendStatus(403);
            } else {
                res.locals = response;
                next();
            }

        });
    }
}

function refreshToken(req, res, next) {

    let refreshToken = req.cookies.refreshToken;
    if (refreshToken == null) {
        return res.sendStatus(401);
    } else {
        jwt.verify(refreshToken, process.env.ACCESS_REFRESH_TOKEN, (err, response) => {
            if (err) {
                if (err.message == 'jwt expired')
                    return res.status(401).json('please login');
                else
                    return res.sendStatus(403);
            } else {
                res.locals = response;
                next();
            }
        });
    }
}

function checkRefreshToken(req, res, next) {
    console.log(req);
    console.log('\nsssssssssss\n');
    console.log(req.cookies);
    let refreshToken = req.cookies.refreshToken;
    if (refreshToken == null) {
        return res.sendStatus(403);
    } else {
        jwt.verify(refreshToken, process.env.ACCESS_REFRESH_TOKEN, (err, response) => {
            if (err) {
                if (err.message == 'jwt expired')
                    return res.clearCookie('refreshToken').status(401).json('please login');
                else
                    return res.sendStatus(403);
            } else {
                res.locals = response;
                next();
            }
        });
    }
}


module.exports = { authenticateToken, refreshToken, checkRefreshToken }
