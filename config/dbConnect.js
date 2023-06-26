const mongoose = require('mongoose');
require('dotenv').config();

module.exports = function mongooseConnection() {
    mongoose.set('strictQuery', true)
    mongoose.connect(process.env.MONGOOSE_CONNECTION, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => {
            console.log("DB Connected");
        }
        )
};


