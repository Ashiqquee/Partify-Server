const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    serviceName:{
        type:String,
        required:true,
        trim: true,
        unique:true,
    },

    serviceImage : {
        type:String,
        required:true,

    }
});


const serviceModel = mongoose.model("services", serviceSchema);
module.exports = serviceModel;