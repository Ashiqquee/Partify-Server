const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    providerId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'provider',
        required: true
    },
    alternativeNumber:{
        type:Number,
    },
    orderDate : {
        type:Date,
        default:Date.now()
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled by customer','cancelled by provider'],
        default: 'pending'
    },
    services:{
        type:Array,
        ref: 'services',
        required: true
    },
    advanceAmount: {
        type:Number,
        required:true
    },
    totalAmount : {
        type :Number,
        required:true
    },
    eventDate:{
        type :Date,
        required:true
    },
  
    advancePaymentDate:{
        type:Date,
    },
    walletAmount : {
        type:Number,
        default:0
    },
    address: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        zip:{
            type:Number,
            required:true
        }
    },
});



const orderModel = mongoose.model('orders',orderSchema);

module.exports = orderModel;