const connection = require('../connection');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const { authenticateToken } = require('../services/authentication');
const checkRole = require('../services/checkRole');

//add product
router.post('/add', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let product = req.body;
        let query = "INSERT INTO cafe.products (product_name, price, category_id, description) VALUES (?, ?, ?, ?)";
        connection.query(query, [product.product_name, product.price, product.category_id, product.description], (err) => {
            if (!err) {
                return res.status(200).json("added successfully!");
            } else {
                return res.status(500).json(err);
            }
        });
    } else
        res.status(401).json('admins only')
});

//get all products for admin 
router.get('/getProducts', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let query = "select categories.category_name, categories.category_id, products.product_id, products.product_name, products.price, products.description, products.order_count, products.status from cafe.products, cafe.categories where products.category_id = categories.category_id order by category_name";
        connection.query(query, [], (err, result) => {
            if (!err) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(err);
            }
        });
    } else
        res.status(401).json('admins only')
});

//get products of specific category
router.get('/getProducts/:id', authenticateToken, (req, res) => {
    let category_id = req.params.id;
    let query = "select product_id, product_name, price, description from cafe.products where category_id = ? && status = 'true' order by product_name";
    connection.query(query, [category_id], (err, result) => {
        if (!err) {
            return res.status(200).json(result);
        } else {
            return res.status(500).json(err);
        }
    });
});


//edit product data
router.patch('/update/:id', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let product_id = req.params.id;

        let product_name = req.body.product_name;
        let price = req.body.price;
        let category_id = req.body.category_id;
        let description = req.body.description;
        let status = req.body.status;

        let obj = { 'product_name': product_name, 'price': price, 'category_id': category_id, 'description': description, 'status': status };
        let first = true;

        let query = 'UPDATE cafe.products SET ';
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
        query += ' WHERE (product_id = ?)';
        values.push(product_id);
        connection.query(query, values, (err) => {
            if (!err) {
                return res.status(200).json("updated successfully!");
            } else {
                return res.status(500).json(err);
            }
        });
    } else
        res.status(401).json('admins only')
});

//delete product
router.delete('/delete/:id', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let id = req.params.id;
        let query = "DELETE FROM cafe.products WHERE product_id = ?";
        connection.query(query, [id], (err) => {
            if (!err) {
                return res.status(200).json("deleted successfully!");
            } else {
                return res.status(500).json(err);
            }
        });
    } else
        res.status(401).json('admins only')
});

module.exports = router;