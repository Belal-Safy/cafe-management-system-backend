require('dotenv').config();
const connection = require('../connection');

function checkRole(req, res, next) {
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            connection.release();
            return res.status(500).json(conn_error);
        }
        let query = "select role from cafe.users where user_id=?";
        connection.query(query, [res.locals.user_id], (err, result) => {
            if (!err) {
                res.locals.role = result[0].role;
                next();
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
}

module.exports = checkRole;