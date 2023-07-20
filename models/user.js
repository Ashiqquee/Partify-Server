const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: Number,
            required: true,
        },
        password: {
            type: String,
            trim: true,
            required: true,
            minlength: [6],
        },
        image: {
            type: String,
        },
        place:{
            type: String,
        },
        wallet: {
            type: Number,
            default:0,
        },
        
        referalNumber: {
            type: String,
            trim: true,
            required: true,
            minlength: [8, 'The referral number must be at least 8 digits long.'],
            maxlength: [8, 'The referral number cannot exceed 8 digits.'],
        },
        isBanned: { type: Boolean, default: false },
        likedPost : {
            type: Array,
            ref: 'post',        }
    },
    {
        timestamps: true,
    }
);

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;