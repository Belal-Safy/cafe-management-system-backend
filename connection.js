const mysql = require('mysql');
require('dotenv').config();

const connection = mysql.createConnection({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (!err) {
        console.log("conneted successfully to database")
    } else {
        console.log("error connecting database! :\n", err)
    }
});

module.exports = connection;