const pool = require('../connection');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const uuid = require('uuid');
const ejs = require('ejs');
const path = require('path')
const pdf = require('html-pdf');
const fs = require('fs');
const { authenticateToken } = require('../services/authentication');
const checkRole = require('../services/checkRole');

router.post('/add', authenticateToken, (req, res) => {
    const order = req.body;
    const generatedUuid = uuid.v1();
    let current_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        //increse orders count for the customer
        let query1 = 'UPDATE belalsaf_cafe.customers SET orders = orders + 1 WHERE (customer_id = ?)';
        connection.query(query1, [order.customer_id], (err) => {
            if (err) {
                return res.status(500).json(err);
            }
        })

        //increse orderd count for each product
        order.products.forEach(product => {
            let query2 = 'UPDATE belalsaf_cafe.products SET order_count = order_count + ? WHERE (product_id = ?)';
            connection.query(query2, [product.quantity, product.product_id], (err) => {
                if (err) {
                    return res.status(500).json(err);
                }
            })
        });

        let query3 = "INSERT INTO belalsaf_cafe.bills (uuid, timestamp, customer_id, cashier_id, products, payment_method, notes, total, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        connection.query(query3, [generatedUuid, current_date, order.customer_id, res.locals.user_id, JSON.stringify(order.products), order.payment_method, order.notes, order.total, order.discount], (err) => {
            if (!err) {
                return res.status(200).json({ uuid: generatedUuid });
            } else {
                return res.status(500).json(err);
            }
        })
        connection.release();
    });
})

//get all bills for admin
router.get('/getBills', authenticateToken, (req, res) => {
    let query = "select * from belalsaf_cafe.bills order by timestamp DESC";
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        connection.query(query, [], (err, result) => {
            if (!err) {
                formatDateAndProducts(result);
                return res.status(200).json(result);
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
});

function formatDateAndProducts(result) {
    result.forEach(bill => {
        let date = bill.timestamp;

        date.setTime(date.getTime() + process.env.TIMEZONE * 60 * 60 * 1000); //add timezone hours
        //format date
        date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

        bill.timestamp = date;
        bill.total_products = JSON.parse(bill.products).length;
    });
}

//get bill pdf
router.get('/getPDF/:uuid', authenticateToken, (req, res) => {
    let uuid = req.params.uuid;
    res.contentType('application/pdf');
    const path = './generated bills/' + 'bill-' + uuid + '.pdf';
    if (fs.existsSync(path)) {
        fs.createReadStream(path).pipe(res);
    } else {
        let query = "select * from belalsaf_cafe.bills where uuid = ?";

        pool.getConnection((conn_error, connection) => {
            if (conn_error) {
                return res.status(500).json(conn_error);
            }
            connection.query(query, [uuid], (err, result) => {
                if (!err) {
                    if (result.length > 0)
                        generatePDF(res, result[0], uuid)
                    else
                        return res.status(400).json('there\'s no any bills with this uuid');
                } else {
                    return res.status(500).json(err);
                }
            });
            connection.release();
        });
    }
});

function generatePDF(res, mainResult, uuid) {
    let date = mainResult.timestamp;
    let subtotal = 0;
    date.setTime(date.getTime() + process.env.TIMEZONE * 60 * 60 * 1000); //add timezone hours
    date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(); //format date

    let notes = mainResult.notes;
    let payment_method = mainResult.payment_method;
    let discount = mainResult.discount;
    let total = mainResult.total;
    let products = JSON.parse(mainResult.products);

    let billData = { uuid: uuid, date: date, payment_method: payment_method, total: total, notes: notes, discount: discount };
    let detailedProducts = [];
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        products.forEach(p => {
            let product_id = p.product_id;
            let quantity = p.quantity;

            let detailedProduct = { quantity: quantity };
            let query = "select product_name, price from belalsaf_cafe.products where product_id = ?";

            connection.query(query, [product_id], (err, result) => {
                if (!err) {
                    if (result[0] != undefined) {
                        detailedProduct.product_name = result[0].product_name;
                        detailedProduct.price = result[0].price;
                        let x = parseFloat((result[0].price * quantity).toFixed(2));
                        detailedProduct.subtotal = x;
                        subtotal = parseFloat((subtotal + x).toFixed(2));
                        billData.subtotal = subtotal;
                        billData.discounted_subtotal = parseFloat((subtotal * (parseFloat(mainResult.discount) / 100)).toFixed(2));
                        billData.tax = parseFloat(((subtotal - billData.discounted_subtotal) * 0.14).toFixed(2));
                    } else {
                        detailedProduct.product_name = 'deleted product';
                        detailedProduct.price = 'unknown';
                        detailedProduct.subtotal = 'unknown';
                    }
                    detailedProducts.push(detailedProduct);
                } else {
                    return res.status(500).json(err);
                };
            });
        });
        connection.release();
    });
    billData.products = detailedProducts;

    let query = "select customers.customer_name, customers.address, customers.email, customers.phone, users.name from belalsaf_cafe.customers ,belalsaf_cafe.users  where customers.customer_id = ? and users.user_id = ?";
    pool.getConnection((conn_error, connection) => {
        if (conn_error) {
            return res.status(500).json(conn_error);
        }
        connection.query(query, [mainResult.customer_id, mainResult.cashier_id], (err, results) => {
            if (!err) {
                billData.customer_name = results[0].customer_name;
                billData.address = results[0].address;
                billData.email = results[0].email;
                billData.phone = results[0].phone;
                billData.cashier_name = results[0].name;
                billData.image = process.env.LogoURL;

                new Promise((resolve, reject) => {
                    ejs.renderFile(path.join(__dirname, "../views", "billTemplate.ejs"), billData, (err, data) => {
                        if (err) {
                            console.log(err)
                            return res.status(500).json(err);
                        } else {
                            const path = './generated bills/' + 'bill-' + uuid + '.pdf';
                            pdf.create(data, { "width": "3in" }).toFile(path, (err) => {
                                if (err) {
                                    return res.status(500).json(err);
                                } else {
                                    fs.createReadStream(path).pipe(res);
                                }
                            });
                        };
                    });
                });
            } else {
                return res.status(500).json(err);
            }
        });
        connection.release();
    });
}

router.delete('/delete/:uuid', authenticateToken, checkRole, (req, res) => {
    if (res.locals.role == 'admin') {
        let uuid = req.params.uuid;
        let query = "DELETE FROM belalsaf_cafe.bills WHERE (uuid = ?)";
        pool.getConnection((conn_error, connection) => {
            if (conn_error) {
                return res.status(500).json(conn_error);
            }
            connection.query(query, [uuid], (err) => {
                if (!err) {
                    return res.status(200).json("deleted successfully!");
                } else {
                    return res.status(500).json(err);
                };
            });
            connection.release();
        });
    } else
        res.status(401).json('admins only');
});


module.exports = router;