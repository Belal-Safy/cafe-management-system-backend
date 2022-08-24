const connection = require('../connection');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const { authenticateToken } = require('../services/authentication');
const checkRole = require('../services/checkRole');

//add category
router.post('/add', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let category = req.body.category_name;
        let query = "INSERT INTO cafe.categories (category_name) VALUES (?)";
        connection.query(query, [category], (err) => {
            if (!err) {
                return res.status(200).json("added successfully!");
            } else {
                return res.status(500).json(err);
            }
        });
    } else
        res.status(401).json('admins only')
});

//get categories
router.get('/getCategories', authenticateToken, (req, res) => {
    let query = "select * from cafe.categories order by category_name";
    connection.query(query, [], (err, result) => {
        if (!err) {
            return res.status(200).json(result);
        } else {
            return res.status(500).json(err);
        }
    });
});

//edit category data
router.patch('/update/:id', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let id = req.params.id;
        let new_name = req.body.category_name;
        let query = 'UPDATE cafe.categories SET category_name =? WHERE category_id =?';

        connection.query(query, [new_name, id], (err) => {
            if (!err) {
                return res.status(200).json("updated successfully!");
            } else {
                return res.status(500).json(err);
            }
        });
    } else
        res.status(401).json('admins only')
});

//delete category
router.delete('/delete/:id', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let id = req.params.id;
        let query = "DELETE FROM cafe.categories WHERE category_id = ?"
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