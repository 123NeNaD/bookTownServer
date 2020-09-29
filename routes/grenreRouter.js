var express = require('express');
const bodyParser = require('body-parser');
var Genres = require('../models/genres');
var authenticate = require('../authenticate');
const cors = require('./cors');

var router = express.Router();
router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });
router.get('/', cors.corsWithOptions, (req, res, next) => {
    Genres.find(req.query)
        .then((genres) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            //"res.json()" takes as a parameter a JSON string, and then it will put
            //that into the body of the response message and send it back to the client.
            res.json(genres);
            //If an error is returned, the error will be passed to overall error handler for our application.
        }, (err) => next(err))
        .catch((err) => next(err));
});
router.post('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, authenticate.verifyAdmin, (req, res, next) => {
    Genres.create(req.body)
        .then((genre) => {
            console.log('Genre Created ', genre);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(genre);
        }, (err) => next(err))
        .catch((err) => next(err));
});

router.route('/:genreName')
    .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /genres/' + req.params.genreName);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /genres/' + req.params.genreName);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /genres/' + req.params.genreName);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, authenticate.verifyAdmin, (req, res, next) => {
        Genres.findOneAndDelete({ name: req.params.genreName })
            .then((resp) => {
                res.statusCode = 200;
                res.end('Genre ' + resp.name + ' successfully deleted.');
            }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = router;