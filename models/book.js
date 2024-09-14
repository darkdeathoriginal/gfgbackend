const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  available: {
    type: Number,
    required: true,
    min: 0
  },
  borrowers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

BookSchema.virtual('url').get(function() {
  return '/books/' + this._id;
});

module.exports = mongoose.model('Book', BookSchema);