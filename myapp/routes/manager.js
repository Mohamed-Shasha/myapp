var express = require('express');
var router = express.Router();
var db = require('../database');


/* GET page. */
router.get('/', function (req, res, next) {

    var sql = "SELECT SUM(qty) AS qty, SUM(price) AS price FROM orders";

    db.query(sql, function (err, data, fields) {
        if (err) throw err;
        res.render('manager', {title: 'manager List', userData: data});
    });
});

module.exports = router;
