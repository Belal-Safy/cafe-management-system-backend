const pool = require('../connection');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const { authenticateToken } = require('../services/authentication');
const checkRole = require('../services/checkRole');

//add category
router.post('/add', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let category = req.body.category_name;
        let query = "INSERT INTO belalsaf_cafe.categories (category_name) VALUES (?)";
        pool.getConnection((conn_error, connection) => {
            if (conn_error) {
                return res.status(500).json(conn_error);
            }
            connection.query(query, [category], (err) => {
                if (!err) {
                    return res.status(200).json("added successfully!");
                } else {
                    return res.status(500).json(err);
                };
                connection.release();
            });
        });
    } else
        res.status(401).json('admins only')
});

//get categories
router.get('/getCategories', authenticateToken, (req, res) => {
    let query = "select * from belalsaf_cafe.categories order by category_name";
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        connection.query(query, [], (err, result) => {
            if (!err) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(err);
            };
            connection.release();
        });
    });
});

//edit category data
router.patch('/update/:id', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let id = req.params.id;
        let new_name = req.body.category_name;
        let query = 'UPDATE belalsaf_cafe.categories SET category_name =? WHERE category_id =?';
        pool.getConnection((conn_error, connection) => {
            if (conn_error) {
                return res.status(500).json(conn_error);
            }
            connection.query(query, [new_name, id], (err) => {
                if (!err) {
                    return res.status(200).json("updated successfully!");
                } else {
                    return res.status(500).json(err);
                };
            });
            connection.release();
        });
    } else
        res.status(401).json('admins only')
});

//delete category
router.delete('/delete/:id', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let id = req.params.id;
        let query = "DELETE FROM belalsaf_cafe.categories WHERE category_id = ?";
        pool.getConnection((conn_error, connection) => {
            if (conn_error) {
                return res.status(500).json(conn_error);
            }
            connection.query(query, [id], (err) => {
                if (!err) {
                    return res.status(200).json("deleted successfully!");
                } else {
                    return res.status(500).json(err);
                }
            });
            connection.release();
        });
    } else
        res.status(401).json('admins only');
});


module.exports = router;