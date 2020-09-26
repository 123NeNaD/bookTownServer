var express = require('express');
const bodyParser = require('body-parser');
var Books = require('../models/books');
var passport = require('passport');
var authenticate = require('../authenticate');
const cors = require('./cors');
var request = require('request');

var router = express.Router();
router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });
router.get('/', cors.corsWithOptions, (req, res, next) => {
    Books.find(req.query)
        .then((books) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            //"res.json()" takes as a parameter a JSON string, and then it will put
            //that into the body of the response message and send it back to the client.
            res.json(books);
            //If an error is returned, the error will be passed to overall error handler for our application.
        }, (err) => next(err))
        .catch((err) => next(err));
});
router.post('/', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Books.create(req.body)
        .then((book) => {
            console.log('Book Created ', book);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(book);
        }, (err) => next(err))
        .catch((err) => next(err));
});

router.route('/:bookName')
    .get(cors.cors, (req, res, next) => {
        Books.findOne({ name: req.params.bookName })
            .then((book) => {
                console.log("Saljem knjigu sa servera", book);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(book);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Books.findOneAndUpdate({ name: req.params.bookName }, {
            //The update will be in the body of the message.
            $set: req.body
        }, { new: true })
            .then((book) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(book);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /books/' + req.params.bookName);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Books.findOneAndDelete({ name: req.params.bookName })
            .then((resp) => {
                res.statusCode = 200;
                res.end('Book ' + resp.name + ' successfully deleted.');
            }, (err) => next(err))
            .catch((err) => next(err));
    });

router.route('/approve/:bookName')
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, (req, res, next) => {
        Books.findOne({ name: req.params.bookName })
            .then((book) => {
                if (book.approved === false) {
                    console.log("Knjiga je:" + book.approved);
                    book.approved = true;
                    book.save((err, book) => {
                        if (err) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.json({ err: err });
                            return;
                        }
                        console.log("Knjiga je odobrena", book);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(book);
                    });
                } else {
                    console.log("Knjiga je vec odobrena", book);
                    res.statusCode = 200;
                    res.end('Book ' + book.name + ' is already approved.');
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = router;