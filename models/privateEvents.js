const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var commentSchema = new Schema({
    comment: {
        type: String,
        maxlength: 1000
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true
});

var privateEventSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    begin: {
        type: Date,
        required: true
    },
    end: {
        type: Date
    },
    description: {
        type: String,
        default: ""
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    active: {
        type: Boolean,
        default: false
    },
    comments: [commentSchema],
    pending: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

var privateEvents = mongoose.model('PrivateEvent', privateEventSchema);

//We are exporting the model
module.exports = privateEvents;