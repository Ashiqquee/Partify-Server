const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    providerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'provider',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'users',
        required: true
    },
    reviewContent: {
        type: String,
        required: true,
    },
    rating: {
        type:Number,
        required:true,
    }
}, { timestamps: true });

const reviewModel = mongoose.model('Review', reviewSchema);

module.exports = reviewModel;
