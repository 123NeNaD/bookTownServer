var express = require('express');
const bodyParser = require('body-parser');
var privateEvents = require('../models/privateEvents');
var authenticate = require('../authenticate');
const cors = require('./cors');
var router = express.Router();
router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });
router.get('/', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    privateEvents.find(req.query)
        .populate("author")
        .then((privateEvent) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            //"res.json()" takes as a parameter a JSON string, and then it will put
            //that into the body of the response message and send it back to the client.
            res.json(privateEvent);
            //If an error is returned, the error will be passed to overall error handler for our application.
        }, (err) => next(err))
        .catch((err) => next(err));
});
router.post('/', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    privateEvents.create(req.body)
        .then((privateEvent) => {
            privateEvent.author = req.user._id;
            privateEvent.type = "private";
            privateEvent.save((err, privateEvent) => {
                if (err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ err: err });
                    return;
                }
                console.log('Private Event Created ', privateEvent);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(privateEvent);
            });
        }, (err) => next(err))
        .catch((err) => next(err));
});

router.route('/:privateEventName')
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        privateEvents.findOne({ name: req.params.privateEventName })
            .then((privateEvent) => {
                console.log("Saljem Private Event sa servera", privateEvent);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(privateEvent);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        privateEvents.findOne({ name: req.params.privateEventName })
            .then((privateEvent) => {
                if (req.user._id.equals(privateEvent.author) || req.user.type === "admin") {
                    privateEvents.findOneAndUpdate({ name: req.params.privateEventName }, {
                        //The update will be in the body of the message.
                        $set: req.body
                    }, { new: true })
                        .then((privateEvent) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(privateEvent);
                        }, (err) => next(err))
                        .catch((err) => next(err));
                } else {
                    res.statusCode = 401;
                    res.end('This is not your private event. Only user who create private event can update it!');
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /privateEvents/' + req.params.privateEventName);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        privateEvents.findOne({ name: req.params.privateEventName })
            .then((privateEvent) => {
                if (req.user._id.equals(privateEvent.author) || req.user.type === "admin") {
                    privateEvents.findOneAndDelete({ name: req.params.privateEventName })
                        .then((resp) => {
                            res.statusCode = 200;
                            res.end('Private Event ' + resp.name + ' successfully deleted.');
                        }, (err) => next(err))
                        .catch((err) => next(err));
                } else {
                    res.statusCode = 401;
                    res.end('This is not your private event. Only user who create private event can delete it!');
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = router;