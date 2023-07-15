const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    providerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'provider',
        required: true
    },

    postImages:{
        type: Array,
        required:true
    },
    caption:{
        type:String,
        required:true
    },
    tagline:{
        type:String
    },
    comments:{
        type:Array,
        ref: 'services',
    },
    likes:{
        type:Array,
        ref:'users',
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});


const postModel = mongoose.model('post', postSchema);
module.exports = postModel;

