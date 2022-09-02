const pool = require('../connection');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const { authenticateToken } = require('../services/authentication');
const checkRole = require('../services/checkRole');

//add customer
router.post('/add', authenticateToken, (req, res) => {
    let customer = req.body;
    let query = "INSERT INTO belalsaf_cafe.customers (customer_name, email, phone, address) VALUES (?, ?, ?, ?)";
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        connection.query(query, [customer.customer_name, customer.email, customer.phone, customer.address], (err) => {
            if (!err) {
                return res.status(200).json("added successfully!");
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
});

//get all customers for admin
router.get('/getCustomers', authenticateToken, (req, res) => {
    let query = "select * from belalsaf_cafe.customers order by customer_name";
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        connection.query(query, [], (err, result) => {
            if (!err) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
});

//get specific customer
router.get('/get/:emailOrPhone', authenticateToken, (req, res) => {
    let emailOrPhone = req.params.emailOrPhone;
    let query = "select * from belalsaf_cafe.customers where email = ? or phone = ?";
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        connection.query(query, [emailOrPhone, emailOrPhone], (err, result) => {
            if (!err) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
});

//update customer info
router.patch('/update/:id', authenticateToken, (req, res) => {
    let customer_id = req.params.id;
    if (customer_id != 1) {
        let customer_name = req.body.customer_name;
        let email = req.body.email;
        let phone = req.body.phone;
        let address = req.body.address;

        let obj = { 'customer_name': customer_name, 'email': email, 'phone': phone, 'address': address };
        let first = true;

        let query = 'UPDATE belalsaf_cafe.customers SET ';
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
        query += ' WHERE (customer_id = ?)';
        values.push(customer_id);
        pool.getConnection((conn_error, connection) => {
            if (conn_error) {
                return res.status(500).json(conn_error);
            }
            connection.query(query, values, (err) => {
                if (!err) {
                    return res.status(200).json("updated successfully!");
                } else {
                    return res.status(500).json(err);
                }
            });
            connection.release();
        });
    } else
        res.status(400).json('can not edit this user');
});


//delete customer
router.delete('/delete/:id', authenticateToken, (req, res) => {
    let id = req.params.id;
    if (id != 1) {
        let query = "DELETE FROM belalsaf_cafe.customers WHERE customer_id = ?";
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
        res.status(400).json('You can not delete the default user');
});


module.exports = router;