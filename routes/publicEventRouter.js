var express = require('express');
const bodyParser = require('body-parser');
var publicEvents = require('../models/publicEvents');
var authenticate = require('../authenticate');
const cors = require('./cors');
var router = express.Router();
router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });
router.get('/', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    publicEvents.find(req.query)
        .then((publicEvent) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            //"res.json()" takes as a parameter a JSON string, and then it will put
            //that into the body of the response message and send it back to the client.
            res.json(publicEvent);
            //If an error is returned, the error will be passed to overall error handler for our application.
        }, (err) => next(err))
        .catch((err) => next(err));
});
router.post('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, (req, res, next) => {
    publicEvents.create(req.body)
        .then((publicEvent) => {
            publicEvent.author = req.user._id;
            publicEvent.type = "public";
            publicEvent.save((err, publicEvent) => {
                if (err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ err: err });
                    return;
                }
                console.log('Public Event Created ', publicEvent);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(publicEvent);
            });
        }, (err) => next(err))
        .catch((err) => next(err));
});

router.route('/:publicEventName')
    .get(cors.cors, (req, res, next) => {
        publicEvents.findOne({ name: req.params.publicEventName })
            .then((publicEvent) => {
                console.log("Saljem Public Event sa servera", publicEvent);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(publicEvent);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, (req, res, next) => {
        publicEvents.findOne({ name: req.params.publicEventName })
            .then((publicEvent) => {
                if (req.user._id.equals(publicEvent.author) || req.user.type === "admin") {
                    publicEvents.findOneAndUpdate({ name: req.params.publicEventName }, {
                        //The update will be in the body of the message.
                        $set: req.body
                    }, { new: true })
                        .then((publicEvent) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(publicEvent);
                        }, (err) => next(err))
                        .catch((err) => next(err));
                } else {
                    res.statusCode = 401;
                    res.end('This is not your public event. Only user who create public event can update it!');
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /publicEvents/' + req.params.publicEventName);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyModerator, (req, res, next) => {
        publicEvents.findOne({ name: req.params.publicEventName })
            .then((publicEvent) => {
                if (req.user._id.equals(publicEvent.author) || req.user.type === "admin") {
                    publicEvents.findOneAndDelete({ name: req.params.publicEventName })
                        .then((resp) => {
                            res.statusCode = 200;
                            res.end('Public Event ' + resp.name + ' successfully deleted.');
                        }, (err) => next(err))
                        .catch((err) => next(err));
                } else {
                    res.statusCode = 401;
                    res.end('This is not your public event. Only user who create public event can delete it!');
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = router;