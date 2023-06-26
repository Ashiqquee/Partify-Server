const Services = require('../models/service')
const cloudinary = require("cloudinary").v2;
const mime = require("mime-types");
const fs = require("fs");
let msg,errMsg;

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
});

module.exports = {


    serviceList: async (req, res) => {

        try {
            const serviceList = await Services.find({}, { serviceImage: 1, serviceName: 1 });
            
            
            res.status(200).json({ serviceList });

        } catch (error) {

            res.status(500).json({ errMsg: 'Something went wrong' })
        }
    },


    addService: async (req, res) => {
       try {
           const { file, body: { name } } = req;
           let serviceName = name.toLowerCase()
           let image;
           if (!file) {
               return res.status(400).json({ errMsg: 'Image needed' })
           }
           if (!name) {
                return res.status(400).json({ errMsg: 'Name needed' })
           }

           const existingName = Services.findOne({serviceName});

           if(existingName){
            return res.status(400).json({errMsg:'Service already found'})
           }

           const mimeType = mime.lookup(file.originalname);
           if (mimeType && mimeType.includes("image/")) {
               const result = await cloudinary.uploader.upload(file.path);
               image = result.secure_url;
               fs.unlinkSync(file.path);
           } else {
                return res.status(400).json({ status: false, errMsg: "File is not a image" })
           }

           const newService = new Services({
               serviceName,
               serviceImage:image
           });
           newService.save();
           res.status(200).json({ newService});
           
       } catch (error) {
            res.status(500).json({errMsg:'Server Error'})
       }

    },

}