const Services = require('../models/service')
const cloudinary = require("cloudinary").v2;
const mime = require("mime-types");
const fs = require("fs");
let msg,errMsg;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
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
        const { file, body: { name } } = req;
        console.log(file);
       try {
           let serviceName = name.toLowerCase()
           let image;
           if (!file) return res.status(400).json({ errMsg: 'Image needed' })
           if (!name) return res.status(400).json({ errMsg: 'Name needed' })
          
           const existingName = await Services.findOne({serviceName});
           
           if(existingName) return res.status(400).json({errMsg:'Service already found'})

           const mimeType = mime.lookup(file.originalname);
           if (mimeType && mimeType.includes("image/")) {
               const result = await cloudinary.uploader.upload(file?.path);
               image = result.secure_url;
               fs.unlinkSync(file.path);
           } else {
               fs.unlinkSync(file.path);
                return res.status(400).json({ status: false, errMsg: "File is not a image" });
           }

           const newService = new Services({
               serviceName,
               serviceImage:image
           });
           await newService.save();
           res.status(200)?.json({ newService});
           
       } catch (error) {
            res.status(500).json({errMsg:'Server Error'});
           fs.unlinkSync(file?.path);
       }

    },

    editServices: async(req,res) => {
       
        const { file, body: { serviceName,_id } } = req;
        
        try {
            const name = serviceName.toLowerCase();
          
            const existingService = await Services.findOne({ serviceName: name, _id: { $ne: _id } });
            
            if (existingService) {
                return res.status(400).json({ errMsg: 'Service name already exists' });
            };
          
            const service = await Services.findById(_id);

           
            if(file&&file.filename){
          
                const mimeType = mime.lookup(file.originalname);
                if (mimeType && mimeType.includes("image/")) {
                    const result = await cloudinary.uploader.upload(file.path);
                    image = result.secure_url;
                    fs.unlinkSync(file?.path);
                } else {
                    fs.unlinkSync(file?.path);
                    return res.status(400).json({ status: false, errMsg: "File is not a image" });
                };
                service.serviceName = name;
                service.serviceImage = image;
                await service.save();
                return res.status(200).json({ service });
            }
            
            service.serviceName = name
            await service.save();
            return res.status(200).json({ service });

        } catch (error) {
            fs.unlinkSync(file?.path);
            res.status(500).json({ errMsg: 'Server Error' });
            
        }
    }

}