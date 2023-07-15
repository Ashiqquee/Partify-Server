const mongoose = require('mongoose');


const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        trim: true,
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'senderType',
        required: true,
    },
    senderType: {
        type: String,
        enum: ['users', 'provider'],
        required: true,
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chat',
    },
    time:{
       type:Date,
       default:Date.now() 
    }
},{
    timestamps:true
});

const messageModel = mongoose.model('messages', messageSchema);

module.exports = messageModel;