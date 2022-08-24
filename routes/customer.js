const connection = require('../connection');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const { authenticateToken } = require('../services/authentication');
const checkRole = require('../services/checkRole');

//add customer
router.post('/add', authenticateToken, (req, res) => {
    let customer = req.body;
    let query = "INSERT INTO cafe.customers (customer_name, email, phone, address) VALUES (?, ?, ?, ?)";
    connection.query(query, [customer.customer_name, customer.email, customer.phone, customer.address], (err) => {
        if (!err) {
            return res.status(200).json("added successfully!");
        } else {
            return res.status(500).json(err);
        }
    });
});

//get all customers for admin
router.get('/getCustomers', authenticateToken, (req, res) => {
    let query = "select * from cafe.customers order by customer_name";
    connection.query(query, [], (err, result) => {
        if (!err) {
            return res.status(200).json(result);
        } else {
            return res.status(500).json(err);
        }
    });
});

//get specific customer
router.get('/get/:emailOrPhone', authenticateToken, (req, res) => {
    let emailOrPhone = req.params.emailOrPhone;
    let query = "select * from cafe.customers where email = ? or phone = ?";
    connection.query(query, [emailOrPhone, emailOrPhone], (err, result) => {
        if (!err) {
            return res.status(200).json(result);
        } else {
            return res.status(500).json(err);
        }
    });
});

//update customer info
router.patch('/update/:id', authenticateToken, (req, res) => {
    let customer_id = req.params.id;
    let customer_name = req.body.customer_name;
    let email = req.body.email;
    let phone = req.body.phone;
    let address = req.body.address;

    let obj = { 'customer_name': customer_name, 'email': email, 'phone': phone, 'address': address };
    let first = true;

    let query = 'UPDATE cafe.customers SET ';
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
    connection.query(query, values, (err) => {
        if (!err) {
            return res.status(200).json("updated successfully!");
        } else {
            return res.status(500).json(err);
        }
    });
});


//delete customer
router.delete('/delete/:id', authenticateToken, (req, res) => {
    let id = req.params.id;
    let query = "DELETE FROM cafe.customers WHERE customer_id = ?"
    connection.query(query, [id], (err) => {
        if (!err) {
            return res.status(200).json("deleted successfully!");
        } else {
            return res.status(500).json(err);
        }
    });
});


module.exports = router;