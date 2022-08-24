const connection = require('../connection');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const { authenticateToken } = require('../services/authentication');
const checkRole = require('../services/checkRole');


//get total statistics
router.get('/totalStatistics', authenticateToken, (req, res) => {
    let query = "select (select count(*) from cafe.products ) as total_products, (select count(*) from cafe.categories ) as total_categories, (select count(*) from cafe.users ) as total_users, (select count(*) from cafe.customers ) as total_customers,(select count(*) from cafe.bills ) as total_bills";
    connection.query(query, [], (err, result) => {
        if (!err) {
            return res.status(200).json(result[0]);
        } else {
            return res.status(500).json(err);
        }
    });
});

//get total categories
router.get('/totalCategories', authenticateToken, (req, res) => {
    let query = "select count(*) as total_categories from cafe.categories";
    connection.query(query, [], (err, result) => {
        if (!err) {
            return res.status(200).json(result[0]);
        } else {
            return res.status(500).json(err);
        }
    });
});

//get total products
router.get('/totalProducts', authenticateToken, (req, res) => {
    let query = "select count(*) as total_products from cafe.products";
    connection.query(query, [], (err, result) => {
        if (!err) {
            return res.status(200).json(result[0]);
        } else {
            return res.status(500).json(err);
        }
    });
});

//get total bills
router.get('/totalBills', authenticateToken, (req, res) => {
    let query = "select count(*) as total_bills from cafe.bills";
    connection.query(query, [], (err, result) => {
        if (!err) {
            return res.status(200).json(result[0]);
        } else {
            return res.status(500).json(err);
        }
    });
});

//get total users
router.get('/totalUsers', authenticateToken, (req, res) => {
    let query = "select count(*) as total_users from cafe.users";
    connection.query(query, [], (err, result) => {
        if (!err) {
            return res.status(200).json(result[0]);
        } else {
            return res.status(500).json(err);
        }
    });
});

//get total customers
router.get('/totalCustomers', authenticateToken, (req, res) => {
    let query = "select count(*) as total_customers from cafe.customers";
    connection.query(query, [], (err, result) => {
        if (!err) {
            return res.status(200).json(result[0]);
        } else {
            return res.status(500).json(err);
        }
    });
});


module.exports = router;