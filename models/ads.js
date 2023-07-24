const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    adImage : {
        type : String,
        required:true,
    },
    adLink : {
        type:String,
        required:true,
    }
});


const adModel = mongoose.model('ads',adSchema);

module.exports = adModel;