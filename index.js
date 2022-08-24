const express = require('express');
const cors = require('cors');
const connection = require('./connection');
require('dotenv').config();

/* Start up an instance of app */
const app = express();

/* Dependencies */
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
/* Middleware*/
app.use('/images', express.static('users-images'));
app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_SERVER, credentials: true }));

app.get('/', (req, res) => {
    res.send("welcome to the backend");
});

app.get('/openTemplate', (req, res, next) => {
    res.render('billTemplate.ejs', {
        uuid: '3e1ead20-087f-11ed-8182-0d15da958d17',
        date: '2022-7-21 0:56:51',
        payment_method: 'cash',
        total: 50,
        notes: 'woooo',
        products: [{
                quantity: 4,
                product_name: 'mango icecream',
                price: 5.9,
                subtotal: '23.60'
            },
            {
                quantity: 2,
                product_name: 'espresso coffe',
                price: 20.99,
                subtotal: '41.98'
            },
            {
                quantity: 1,
                product_name: 'deleted product',
                price: 'unknown',
                subtotal: 'unknown'
            }
        ],
        customer_name: 'Anas',
        email: 'anas@yahoo.com',
        phone: '123456789',
        cashier_name: 'Belal Safy',
        image: process.env.LogoURL,
        subtotal: 550,
        discounted_subtotal: 200,
        tax: 27,
        discount: 10,
        address: '3e1ead20-087f-11ed-8182- 0d15da958d17 3e1ead20-087f-11ed-8182- 0d15da958d17 3e1ead20-087f-11ed-8182- 0d15da958d17 3e1ead20-087f-11ed-8182- 0d15da958d17'
    })
});
//user route
const userRoute = require('./routes/user');
const categoriesRoute = require('./routes/category');
const productsRoute = require('./routes/product');
const customersRoute = require('./routes/customer');
const billsRoute = require('./routes/bill');
const statisticsRoute = require('./routes/statistics');

app.use('/users', userRoute);
app.use('/categories', categoriesRoute);
app.use('/products', productsRoute);
app.use('/customers', customersRoute);
app.use('/bills', billsRoute);
app.use('/statistics', statisticsRoute);

const http = require('http');
const server = http.createServer(app);
server.listen(process.env.PORT)
console.log(`running on http://localhost:${process.env.PORT}`);