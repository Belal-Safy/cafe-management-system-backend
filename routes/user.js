require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const connection = require('../connection');
const { authenticateToken, refreshToken, checkRefreshToken } = require('../services/authentication');
const { generateAccessToken, generateRefreshToken } = require('../services/tokens');
const isAdmin = require('../services/checkRole')
const checkRole = require('../services/checkRole');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require("crypto");
const multer = require('multer');
const fs = require('fs');

let storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './users-images/');
    },
    filename: (req, file, callback) => {
        callback(null, crypto.randomBytes(10).toString('hex') + '.' + file.mimetype.split('image/')[1]);
    }
});

const fileFilter = (req, file, callback) => {
    if (file.mimetype.split('/')[0] == 'image')
        callback(null, true);
    else {
        callback(new Error('Not valid file type, file should be an image'), false);
    }
}

let upload = multer({
    storage: storage,
    limits: { fieldSize: 1024 * 1024 * 5 },
    fileFilter: fileFilter
});

let transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})

//signup
router.post('/signup', async(req, res) => {;
    let user = req.body;
    let query = "select * from cafe.users where email= ?";
    const salt = await bcrypt.genSalt(10);
    try {
        const encryptedPassword = await bcrypt.hash(user.password, salt);
        connection.query(query, [user.email], (err, result) => {
            if (!err) {
                if (result.length <= 0) {
                    let query = "INSERT INTO cafe.users (name, email, password, phone) VALUES (?, ?, ?, ?);";
                    connection.query(query, [user.name, user.email, encryptedPassword, user.phone], (err) => {
                        if (!err) {
                            let query = "select user_id from cafe.users where email= ?";
                            connection.query(query, [user.email], (err, result) => {
                                if (!err) {
                                    let user_id = result[0].user_id;
                                    let token = generateAccessToken(user_id);
                                    let refreshToken = generateRefreshToken(user_id);
                                    let expiry_date = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                                    return res.status(200).cookie('refreshToken', refreshToken, { httpOnly: true, expires: expiry_date }).json({ token: token });
                                } else {
                                    return res.status(500).json(err);
                                }
                            });
                        } else {
                            return res.status(500).json(err);
                        }
                    })
                } else {
                    return res.status(400).json("email already exist!");
                }
            } else {
                return res.status(500).json(err);
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
});

//upload image
router.post('/upload-image', authenticateToken, upload.single('image'), (req, res) => {
    let id = res.locals.user_id;
    let image = req.file.path.split('\\')[1];
    let query = "select img from cafe.users where user_id= ?"
    connection.query(query, [id], (err, result) => {
        if (!err) {
            if (result[0].img != 'default.png') {
                const path = './users-images/' + result[0].img;
                fs.unlinkSync(path);
            }
            let query = 'UPDATE cafe.users SET img = ? WHERE user_id = ?';
            connection.query(query, [image, id], (err) => {
                if (!err) {
                    return res.status(200).json("uploaded successfully");
                } else
                    return res.status(500).json(err);
            });
        } else
            return res.status(500).json(err);
    });
});

//login
router.post('/login', (req, res) => {
    let user = req.body;
    let query = "select password,status from cafe.users where email= ?"
    connection.query(query, [user.email], async(err, result) => {
        if (!err) {
            if (result.length <= 0) {
                return res.status(400).json("this email does not exist!");
            } else {
                if (await bcrypt.compare(user.password, result[0].password)) {
                    if (result[0].status == 0) {
                        return res.status(400).json("deactivated account");
                    } else {
                        let query = "select user_id from cafe.users where email= ?";
                        connection.query(query, [user.email], (err, result) => {
                            if (!err) {
                                let user_id = result[0].user_id;
                                let token = generateAccessToken(user_id);
                                let refreshToken = generateRefreshToken(user_id);
                                let expiry_date = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                                return res.status(200).cookie('refreshToken', refreshToken, { httpOnly: true, expires: expiry_date }).json({ token: token });
                            } else {
                                return res.status(500).json(err);
                            }
                        });
                    }
                } else
                    return res.status(400).json("incorrect password!");
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

//logout
router.get('/logout', (req, res) => {
    res.clearCookie('refreshToken').send({ status: 200 });
})

//(send email with code)
router.post('/SendMail', (req, res) => {
    let email = req.body.email;

    let query = "select name,password from cafe.users where email= ?"
    connection.query(query, [email], async(err, result) => {
        if (!err) {
            if (result.length <= 0) {
                return res.status(400).json("this email does not exist!");
            } else {
                try {
                    const name = result[0].name;
                    const code = Math.floor((Math.random() * 100000) + 48);
                    const salt = await bcrypt.genSalt(10);
                    let hashed_code = await bcrypt.hash(code.toString(), salt);
                    let query = "INSERT INTO cafe.codes (email, code, timestamp) VALUES ( ?, ?, ?) ON DUPLICATE KEY UPDATE code = ?, timestamp = ?;";
                    let current_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
                    connection.query(query, [email, hashed_code, current_date, hashed_code, current_date], (err, result) => {
                        if (!err) {
                            sendMail(email, name, code);
                            return res.status(200).json("email sent successfully!");
                        } else
                            return res.status(500).json(err);
                    });
                } catch (error) {
                    return res.status(500).json(error);
                }
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

function sendMail(email, name, code) {
    let mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Reset password",
        html: `<p>Hi, ${name}<br> use this code to reset your password. <br><b>Code: ${code}</b></p>`
    }
    transporter.sendMail(mailOptions, (err, info) => {
        if (err)
            return err;
        else
            return true;
    })
}

//forgot password (check code)
router.post('/forgottenPasswordCheckCode', (req, res) => {
    let email = req.body.email;
    let code = req.body.code;

    let query = "select code from cafe.codes where email= ?"
    connection.query(query, [email], async(err, result) => {
        if (!err) {
            if (result.length <= 0) {
                return res.status(400).json("incorrect code");
            } else {
                const hashed_code = result[0].code;
                if (await bcrypt.compare(code, hashed_code)) {
                    const payload = { email: email }
                    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN, { expiresIn: '5m' });
                    return res.status(200).json({ accessToken: accessToken });
                } else {
                    return res.status(400).json("incorrect code");
                }
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

//forgot password (change password)
router.patch('/forgottenPasswordChangePassword', authenticateToken, async(req, res) => {
    let email = res.locals.email;
    let new_password = req.body.new_password;
    try {
        const salt = await bcrypt.genSalt(10);
        const encryptedNewPassword = await bcrypt.hash(new_password, salt);
        let query = 'UPDATE cafe.users SET password = ? WHERE email = ?';
        connection.query(query, [encryptedNewPassword, email], (err) => {
            if (!err) {
                return res.status(200).json("changed successfully!");
            } else
                return res.status(500).json(err);
        });
    } catch (error) {
        return res.status(500).json(error);
    }
});

//get all users
router.get('/getAllUsers', authenticateToken, isAdmin, (req, res) => {
    if (res.locals.role == 'admin') {
        let query = "select user_id, name, email, phone, status, role from cafe.users";
        connection.query(query, [req.body.email], (err, result) => {
            if (!err) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(err);
            }
        });
    } else
        res.status(401).json('admins only')
});

//get user info
router.get('/getUser/', authenticateToken, (req, res) => {
    let id = res.locals.user_id;
    let query = "select name, email, img, phone, role from cafe.users where user_id = ?";
    connection.query(query, [id], (err, result) => {
        if (!err) {
            return res.status(200).json(result[0]);
        } else {
            return res.status(500).json(err);
        }
    });
});

//edit user data
router.patch('/updateInfo', authenticateToken, (req, res) => {
    let id = res.locals.user_id;
    let name = req.body.name;
    let email = req.body.email;
    let phone = req.body.phone;

    let obj = { 'name': name, 'email': email, 'phone': phone };
    let first = true;

    let query = 'UPDATE cafe.users SET ';
    let values = [];
    for (let prop in obj) {
        if (obj[prop] != undefined) {
            if (first) {
                query += prop + ' = ?';
                first = false;
            } else {
                query += ', ' + prop + ' = ?';
            }
            values.push(obj[prop]);
        }
    }
    query += ' WHERE (user_id = ?)';
    values.push(id);
    connection.query(query, values, (err) => {
        if (!err) {
            return res.status(200).json("updated successfully!");
        } else {
            return res.status(500).json(err);
        }
    });
});

//change role
router.patch('/updateRole', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let id = req.body.user_id;
        let newRole = req.body.role;

        let query = 'UPDATE cafe.users SET role = ? WHERE (user_id = ?)';
        connection.query(query, [newRole, id], (err) => {
            if (!err) {
                return res.status(200).json("updated successfully!");
            } else {
                return res.status(500).json(err);
            }
        });
    } else
        res.status(401).json('admins only')
});

//change status
router.patch('/updateStatus', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let id = req.body.user_id;
        let newStatus = req.body.status;

        let query = 'UPDATE cafe.users SET status = ? WHERE (user_id = ?)';
        connection.query(query, [newStatus, id], (err) => {
            if (!err) {
                return res.status(200).json("updated successfully!");
            } else {
                return res.status(500).json(err);
            }
        });
    } else
        res.status(401).json('admins only')
});

//change password
router.patch('/changePassword', authenticateToken, async(req, res) => {
    let id = res.locals.user_id;
    let old_password = req.body.old_password;
    let new_password = req.body.new_password;

    let query = 'select password from cafe.users WHERE user_id = ?';
    connection.query(query, [id], async(err, result) => {
        if (!err) {
            if (await bcrypt.compare(old_password, result[0].password)) {
                const salt = await bcrypt.genSalt(10);
                try {
                    const encryptedNewPassword = await bcrypt.hash(new_password, salt);
                    let query = 'UPDATE cafe.users SET password = ? WHERE user_id = ?';
                    connection.query(query, [encryptedNewPassword, id], (err) => {
                        if (!err) {
                            return res.status(200).json("changed successfully!");
                        } else
                            return res.status(500).json(err);
                    });
                } catch (error) {
                    return res.status(400).json(error);
                }

            } else {
                return res.status(400).json("incorrect old password!");
            }
        } else
            return res.status(500).json(err);
    });

});

//delete my account
router.delete('/deleteMe', authenticateToken, (req, res) => {
    let id = res.locals.user_id;
    let query = "select img from cafe.users where user_id= ?"
    connection.query(query, [id], (err, result) => {
        if (!err) {
            if (result[0].img != 'default.png') {
                const path = './users-images/' + result[0].img;
                fs.unlinkSync(path);
            }
            let query = "DELETE FROM cafe.users WHERE (user_id = ?)"
            connection.query(query, [id], (err, result) => {
                if (!err) {
                    return res.status(200).json("deleted successfully!");
                } else {
                    return res.status(500).json(err);
                }
            });
        } else
            return res.status(500).json(err);
    });
});

//delete user
router.delete('/deleteUser/:id', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let id = req.params.id;
        let query = "select img from cafe.users where user_id= ?"
        connection.query(query, [id], (err, result) => {
            if (!err) {
                if (result[0].img != 'default.png') {
                    const path = './users-images/' + result[0].img;
                    fs.unlinkSync(path);
                }
                let query = "DELETE FROM cafe.users WHERE (user_id = ?)";
                connection.query(query, [id], (err) => {
                    if (!err) {
                        return res.status(200).json("deleted successfully!");
                    } else {
                        return res.status(500).json(err);
                    }
                });
            } else
                return res.status(500).json(err);
        });
    } else
        res.status(401).json('admins only');
});

//check token
router.get('/checkRefreshToken', checkRefreshToken, (req, res) => {
    return res.status(200).json("valid refresh token");
});


//refresh token
router.get('/refreshToken', refreshToken, (req, res) => {
    let user_id = res.locals.user_id;
    let token = generateAccessToken(user_id);
    let data = {
        token: token
    }
    return res.status(200).json(data);
});

//check role
router.get('/checkRole', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        return res.status(200).json("autherized");
    } else {
        res.status(401).json('not admin');
    }
});

//get role
router.get('/isAdmin', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        return res.status(200).json(true);
    } else {
        res.status(200).json(false);
    }
});

module.exports = router;