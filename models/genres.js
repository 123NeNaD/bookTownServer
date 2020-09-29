const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var genreSchema = new Schema({
    name: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});


var Genres = mongoose.model('Genre', genreSchema);

//We are exporting the model
module.exports = Genres;