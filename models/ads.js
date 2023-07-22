const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
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