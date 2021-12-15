var createError = require('http-errors');

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var validator = require("email-validator");

const db = require('./database');
var indexRouter = require('./routes/index');
var indexRouter2 = require('./routes/manager');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
var router = express.Router();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// use the route
app.use('/manager', indexRouter2);

app.use('/users', usersRouter);
var SqlString = require('sqlstring');
var sanitizeHtml = require('sanitize-html');
var session = require('express-session');
var crypto = require('crypto');
/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 */
var genRandomString = function (length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') /** convert to hexadecimal format */
        .slice(0, length);   /** return required number of characters */
};

/**
 * hash password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
var sha512 = function (password, salt) {
    var hash = crypto.createHmac('sha512', salt);
    /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
};

function saltHashPassword(user_password) {
    var salt = genRandomString(16);
    /** Gives us salt of length 16 */
    var passwordData = sha512(user_password, salt);
    return passwordData;
}

function checkHashedPassword(user_password, salt) {
    var passwordData = sha512(user_password, salt);
    return passwordData;
}

app.get('/login', function (req, res) {

    console.log("hello");


});


app.post('/login', function (req, res) {

    // catch the username that was sent to us from the jQuery POST on the index.ejs page

    var username = req.body.username;
    var user_password = req.body.password;
    var email = req.body.email;
    var errorMessage = '';

    if (username.length < 6) {

        errorMessage += 'too short username <br>';
    }
    if (user_password.length < 9) {

        errorMessage += 'too short password <br>';

    }

    // Print it out to the NodeJS console just to see if we got the variable.
    console.log("Welcome " + username);

    // This is the actual SQL query part
    if (errorMessage.length <= 0) {
        db.query('select * from login where username=? ', [username], function (error, result, fields) {
            db.on('error', function (err) {
                console.log('MySQL Error', err);
            });
            if (result && result.length) {
                var salt = result[0].salt;
                var encrypted_password = result[0].password;
                var hashed_password = checkHashedPassword(user_password, salt).passwordHash;
                if (encrypted_password === hashed_password) {
                    res.end(JSON.stringify("Welcome"+result[0].acctype));
                } else {
                    res.end(JSON.stringify('wrong password'));
                }

            } else {

                res.json('user not exists');

            }

        });
    } else {
        res.json(JSON.stringify(errorMessage));
    }
});

app.post('/register', function (req, res) {

    // catch the username that was sent to us from the jQuery POST on the index.ejs page
    var usernameR = req.body.usernameR;
    var user_password = req.body.passwordR;
    var hashed = saltHashPassword(user_password);
    var passwordHashed = hashed.passwordHash;
    var salt = hashed.salt
    var email = req.body.email;
    // Print it out to the NodeJS console just to see if we got the variable.
    var errorMessage = '';

    if (usernameR.length < 6) {

        errorMessage += 'too short username <br>';
    }
    if (user_password.length < 9) {

        errorMessage += 'too short password <br>';

    }
    if (email.length < 6) {

        errorMessage += 'too short email <br>';

    }

    if (validator.validate(email) === false) {
        errorMessage += 'Not A Valid Email <br>';
    }

    if (errorMessage.length <= 0) {
        db.query('SELECT * FROM project where email=?', [email], function (err, result, fields) {
            db.on('error', function (err) {
                console.log('mySQL error', err);
            });


            if (result && result.length) {
                res.JSON('user already exist');
            } else {
                var sql = "INSERT INTO login (username, password ,email, salt )Values('" + usernameR + "','" + passwordHashed + "','" + email + "','" + salt + "')";
                db.query(sql, function (error, results, fields) {
                    if (error) throw error;

                });
            }
        });
    } else {

        res.send(errorMessage);
        // window.location ="#register"
    }


});

app.post('/placedorder', function (req, res) {

    // catch the username that was sent to us from the jQuery POST on the index.ejs page
    var cartR = req.body.cart;
    var qtyR = req.body.qty;
    var totalR = req.body.total;
    // Print it out to the NodeJS console just to see if we got the variable.


    // This is the actual SQL query part
    var sql = "INSERT INTO `db`.`orders` (`order`, `qty`, `price`) VALUES ('" + cartR + "','" + qtyR + "','" + totalR + "')";
    db.query(sql, function (error, results, fields) {
            if (error) throw error;

        }
    );


});

app.post('/update', function (req, res) {

    // catch the product name and qty that was sent to us from the jQuery POST on the index.ejs page
    var product = req.body.item;
    var qty = req.body.qtyUpdate;
    var id = req.body.itemID;
    // Print it out to the NodeJS console just to see if we got the variable.


    // This is the actual SQL query part
    db.query('update products  SET  qty=? where id=?', [qty, id], function (error, results, fields) {
            if (error) throw error;

        }
    );


});


// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


module.exports = app;
