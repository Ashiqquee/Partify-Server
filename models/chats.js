const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'provider',
        required: true
    },
    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'messages'
    }
}, {
    timestamps: true
});

const chatModel = mongoose.model('chat', chatSchema);

module.exports = chatModel;