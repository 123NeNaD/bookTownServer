var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/users');
var passport = require('passport');
var authenticate = require('../authenticate');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.find({})
    .then((users) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      //"res.json()" takes as a parameter a JSON string, and then it will put
      //that into the body of the response message and send it back to the client.
      res.json(users);
      //If an error is returned, the error will be passed to overall error handler for our application.
    }, (err) => next(err))
    .catch((err) => next(err));
});

//This "/signup" endpoint will allow a user to sign up on the system. Only the "post" method will be allowed on 
//"/signup" endpoint. The remaining methods will not be allowed. 
router.post('/signup', (req, res, next) => {
  //The "passport-local-mongoose" plugin provides us with a method called "register" on the user Schema and model.
  //"register(user, password, callback)" is a convenience method to register a new user instance with a given password. It also checks if username is unique.
  User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
    if (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({ err: err });
    } else {
      if (req.body.firstname) {
        user.firstname = req.body.firstname;
      }
      if (req.body.lastname) {
        user.lastname = req.body.lastname;
      }
      if (req.body.image) {
        user.image = req.body.image;
      }
      if (req.body.birthDate) {
        user.birthDate = req.body.birthDate;
      }
      if (req.body.city) {
        user.city = req.body.city;
      }
      if (req.body.country) {
        user.country = req.body.country;
      }
      if (req.body.email) {
        user.email = req.body.email;
      }
      //Saving the modification that we have done to the user
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({ err: err });
          return;
        }
        //To ensure that the user registration was seccessful, we will try to authenticate the
        //same user that we just registered.
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({ success: true, status: 'Registration Successful!' });
        });
      });
    };
  });
});


router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    //If either the username or password is incorect. Znaci da ili nije pronadjen korisnik sa tim korisnickim imenom, ili je lozinka netacna.
    //Razlog zasto je logovanje korisnika bilo neuspesno bice sadrzan u "info" koji saljemo nazad korisniku.
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({ success: false, status: 'Login Unsuccessful!', err: info });
    }
    //The "passport.authenticate" will add method "req.logIn".
    //So, we will try to login the user. We are passing the "user" as the parameter to "req.logIn()".
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!' });
      }
      //Ako smo dosli do ovde, to znaci da se korisnik uspesno ulogovao, i mozemo da napravimo JSON Web Token
      //koji saljemo korisniku.
      var token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({ success: true, status: 'Login Successful!', token: token });
    });
  })(req, res, next);
});

//This "/logout" endpoint will allow a user to logout from the system. Only the "get" method will be allowed on 
//"/logout" endpoint. The remaining methods will not be allowed. We are doing the "get" for logging out because for
//logging out we dont need  to submit any information.
router.get('/logout', (req, res, next) => {
  //Brisemo JSON Web Token na klijentskoj strani i tako radimo Logout-ovanje.
  res.redirect('/');

});

//It is quite possible that while the client has logged in and obtained the JSON Web Token, sometime later, the JSON Web Token may expire. 
//And so if the user tries to access from the client side with an expired token to the server, then the server will not be able to authenticate 
//the user. So at periodic intervals we may wish to cross-check to make sure that the JSON Web Token is still valid. So that is the reason why 
//we are including another endpoint called "/checkJWTtoken", so if you do a GET to the "/checkJWTToken" by including the token into the 
//Authorization Header, then this call will return a true or false to indicate to you whether the JSON Web Token is still valid or not.
//If it is not valid then the client side can initiate another login for For the user to obtain a new JSON Web Token, if required.
router.get('/checkJWTtoken', (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: 'JWT invalid!', success: false, err: info });
    }
    else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: 'JWT valid!', success: true, user: user });
    }
  })(req, res, next);
});

module.exports = router;
