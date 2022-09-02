const pool = require('../connection');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const { authenticateToken } = require('../services/authentication');
const checkRole = require('../services/checkRole');


//get total statistics
router.get('/totalStatistics', authenticateToken, (req, res) => {
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        let query = "select (select count(*) from belalsaf_cafe.products ) as total_products, (select count(*) from belalsaf_cafe.categories ) as total_categories, (select count(*) from belalsaf_cafe.users ) as total_users, (select count(*) from belalsaf_cafe.customers ) as total_customers,(select count(*) from belalsaf_cafe.bills ) as total_bills";
        connection.query(query, [], (err, result) => {
            if (!err) {
                return res.status(200).json(result[0]);
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
});

//get total categories
router.get('/totalCategories', authenticateToken, (req, res) => {
    let query = "select count(*) as total_categories from belalsaf_cafe.categories";
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        connection.query(query, [], (err, result) => {
            if (!err) {
                return res.status(200).json(result[0]);
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
});

//get total products
router.get('/totalProducts', authenticateToken, (req, res) => {
    let query = "select count(*) as total_products from belalsaf_cafe.products";
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        connection.query(query, [], (err, result) => {
            if (!err) {
                return res.status(200).json(result[0]);
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
});

//get total bills
router.get('/totalBills', authenticateToken, (req, res) => {
    let query = "select count(*) as total_bills from belalsaf_cafe.bills";
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        connection.query(query, [], (err, result) => {
            if (!err) {
                return res.status(200).json(result[0]);
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
});

//get total users
router.get('/totalUsers', authenticateToken, (req, res) => {
    let query = "select count(*) as total_users from belalsaf_cafe.users";
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        connection.query(query, [], (err, result) => {
            if (!err) {
                return res.status(200).json(result[0]);
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
});

//get total customers
router.get('/totalCustomers', authenticateToken, (req, res) => {
    let query = "select count(*) as total_customers from belalsaf_cafe.customers";
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        connection.query(query, [], (err, result) => {
            if (!err) {
                return res.status(200).json(result[0]);
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
});


module.exports = router;