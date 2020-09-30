var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

//"username" and "password" will be automatically added in by "passport-local-mongoose".
//Using "passport-local-mongoose" as a plugin in our mongoose Schema and model.
//This will automatically add a "username", "hash" and "salt" fields to store the username,
//the hashed password and the salt value. It also adds support for additional methods 
//on the user Schema and the model which are useful for passport authetication.
var commentSchema = new Schema({
    rating: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    comment: {
        type: String,
        maxlength: 1000
    },
    bookCommentId: {
        type: mongoose.Schema.Types.ObjectId
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    },
}, {
    timestamps: true
});


var userSchema = new Schema({
    firstname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
        default: ''
    },
    registered: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,
        default: 'images/Avatar.png'
    },
    birthDate: {
        type: Date
    },
    city: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    type: {
        type: String,
        default: "basic"
    },
    lastLogin: {
        type: Date
    },
    pastBooks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    }],
    futureBooks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    }],
    presentBooks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    }],
    comments: [commentSchema],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

//Using "passport-local-mongoose" as a plugin in our mongoose Schema and model.
//This will automatically add a "username", "hash" and "salt" fields to store the username,
//the hashed password and the salt value. It also adds support for additional methods 
//on the user Schema and the model which are useful for passport authetication.
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);