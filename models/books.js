const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

//When nesting Schemas, always declare the child schema first before passing it into its parent.
var bookSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    autors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    published: {
        type: Date,
        required: true
    },
    types: [{
        type: String,
        require: true
    }],
    comments: [commentSchema],
    averageRating: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    }
}, {
    timestamps: true
});
var Books = mongoose.model('Book', bookSchema);

//We are exporting the model
module.exports = Books;