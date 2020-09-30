var express = require('express');
const bodyParser = require('body-parser');
var Books = require('../models/books');
var Users = require('../models/users');
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

router.route('/:bookId')
    .get(cors.cors, (req, res, next) => {
        Books.findOne({ _id: req.params.bookId })
            .populate('comments.author')
            .then((book) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(book);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, (req, res, next) => {
        Books.findOneAndUpdate({ _id: req.params.bookId }, {
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
        res.end('POST operation not supported on /books/' + req.params.bookId);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Books.findOneAndDelete({ _id: req.params.bookId })
            .then((book) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(book);
            }, (err) => next(err))
            .catch((err) => next(err));
    });

router.route('/approve/:bookId')
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, (req, res, next) => {
        Books.findOne({ _id: req.params.bookId })
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

router.route('/:bookId/comments')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Books.findOne({ _id: req.params.bookId })
            .populate('comments.author')
            .then((book) => {
                if (book != null) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    // @ts-ignore
                    res.json(book.comments);
                }
                else {
                    var err = new Error('Book ' + req.params.bookId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Books.findOne({ _id: req.params.bookId })
            .then((book) => {
                if (book != null) {
                    //The body of the request message contains the comment already, but the author property will not be there
                    //in the body of the request message. So, depending on which user is posting this information we can
                    //populate the author field. S obzirom da je odgovarajuci korisnik vec autentifikovan da bi dosao do ovog dela,
                    //vec imamo tog korisnika u "req.user" property-ju. Dakle, uzimamo "_id" korisnika koji predstavlja ObjectID
                    //odgovarajuceg User documenta i to pamtimo u "author" polju. Tako da vise klijent nece unositi svoje ime, vec
                    //ce se to automatski obavljati na serveru kada korisnik pokusa da onese komentar, nakon autentifikacije tog korisnika.
                    req.body.author = req.user._id;
                    book.comments.push(req.body);
                    book.save()
                        .then((book) => {
                            book.comments.sort(function (comment1, comment2) {
                                if (comment1.createdAt < comment2.createdAt) { return 1 }
                                else if (comment1.createdAt > comment2.createdAt) { return -1 }
                                else { return 0 };
                            });
                            Users.findOne({ _id: req.user._id })
                                .then((user) => {
                                    user.comments.push({
                                        'rating': req.body.rating,
                                        'comment': req.body.comment,
                                        'book': req.params.bookId,
                                        'bookCommentId': book.comments[0]._id
                                    });
                                    user.save()
                                        .then((user) => {
                                            //Vracamo korisniku knjigu sa dodatim novim komentarom
                                            Books.findOne({ _id: req.params.bookId })
                                                .populate('comments.author')
                                                .then((book) => {
                                                    res.statusCode = 200;
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.json(book);
                                                })
                                        }, (err) => next(err))
                                }, (err) => next(err))

                        }, (err) => next(err));
                }
                else {
                    var err = new Error('Book ' + req.params.bookId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /books/' + req.params.bookId + '/comments');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('DELETE operation not supported on /books/' + req.params.bookId + '/comments');
    });

router.route('/:bookId/comments/:commentId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Books.findOne({ _id: req.params.bookId })
            .populate('comments.author')
            .then((book) => {
                if (book != null && book.comments.id(req.params.commentId) != null) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(book.comments.id(req.params.commentId));
                }
                else if (book == null) {
                    var err = new Error('Book ' + req.params.bookId + ' not found');
                    err.status = 404;
                    return next(err);
                }
                else {
                    var err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /books/' + req.params.bookId + '/comments/' + req.params.commentId);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Books.findOne({ _id: req.params.bookId })
            .then((book) => {
                if (book != null && book.comments.id(req.params.commentId) != null) {
                    //Korisnik moze da update-uje komentar samo ako ga je on i napravio. Korisnik ne moze da menja komentare
                    //koji pripadaju drugim korisnicima. Zato upredjujemo "req.user._id" koji "authenticate.verifyUser" dodaje
                    //nakon uspesne autentifikacije, sa poljem "author" iz tog komentara posto polje "author" sadrzi ObjectId
                    //korisnika koji je napravio taj komentar.
                    //ObjectIDs behave like Strings, and hence when comparing two ObjectIDs, you should 
                    //use the "Id1.equals(id2)" syntax.
                    if (req.user._id.equals(book.comments.id(req.params.commentId).author)) {
                        //There is no specific method for updating subdocuments. We have to do this this way.
                        if (req.body.rating) {
                            book.comments.id(req.params.commentId).rating = req.body.rating;
                        }
                        if (req.body.comment) {
                            book.comments.id(req.params.commentId).comment = req.body.comment;
                        }
                        book.save()
                            //Sada vracamo nazad Dish information korisnik-u, ali nakon nalazenja odgovarajuceg "Dish"-a, radimo
                            //Mongoose Population "author" field-a i onda tek vracamo rezultat.
                            .then((book) => {
                                Books.findOne({ _id: req.params.bookId })
                                    .populate('comments.author')
                                    .then((book) => {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(book);
                                    })
                            }, (err) => next(err));
                    } else {
                        var err = new Error("You are not authorized to update this comment! You can only update your own comments.");
                        err.status = 403;
                        return next(err);
                    }
                }
                else if (book == null) {
                    var err = new Error('Book ' + req.params.bookId + ' not found');
                    err.status = 404;
                    return next(err);
                }
                else {
                    var err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Books.findOne({ _id: req.params.bookId })
            .then((book) => {
                if (book != null && book.comments.id(req.params.commentId) != null) {
                    //Korisnik moze da obrise komentar samo ako ga je on i napravio. Korisnik ne moze da brise komentare
                    //koji pripadaju drugim korisnicima. Zato upredjujemo "req.user._id" koji "authenticate.verifyUser" dodaje
                    //nakon uspesne autentifikacije, sa poljem "author" iz tog komentara posto polje "author" sadrzi ObjectId
                    //korisnika koji je napravio taj komentar.
                    //ObjectIDs behave like Strings, and hence when comparing two ObjectIDs, you should 
                    //use the "Id1.equals(id2)" syntax.
                    if (req.user._id.equals(book.comments.id(req.params.commentId).author)) {
                        book.comments.id(req.params.commentId).remove();
                        book.save()
                            .then((book) => {
                                Users.findOne({ _id: req.user._id })
                                    .then((user) => {
                                        for (var i = (user.comments.length - 1); i >= 0; i--) {
                                            //With ".id()" we are accessing the subodcument by specifying the "_id" of subdocument as a parameter to ".id()".
                                            if (user.comments.id(user.comments[i]._id).bookCommentId == req.params.commentId) {
                                                user.comments.id(user.comments[i]._id).remove();
                                            };
                                        }
                                        user.save()
                                            .then((user) => {
                                                Books.findOne({ _id: req.params.bookId })
                                                    .populate('comments.author')
                                                    .then((book) => {
                                                        res.statusCode = 200;
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.json(book);
                                                    })
                                            }, (err) => next(err));
                                    }, (err) => next(err));
                            }, (err) => next(err));
                    } else {
                        var err = new Error("You are not authorized to delete this comment! You can only delete your own comments.");
                        err.status = 403;
                        return next(err);
                    }
                }
                else if (book == null) {
                    var err = new Error('Book ' + req.params.bookId + ' not found');
                    err.status = 405;
                    return next(err);
                }
                else {
                    var err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 406;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = router;