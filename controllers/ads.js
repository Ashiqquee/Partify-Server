const Ad = require('../models/ads');
const cloudinary = require("cloudinary").v2;
const mime = require("mime-types");
const fs = require("fs");
let msg, errMsg;


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = {
    adsList : async(req,res) => {
        try {
            const adsList = await Ad.find();

            res.status(200).json({adsList});

        } catch (error) {
            console.log(error);
            res.status(500).json({ errMsg: 'Something went wrong' })

        }
    },

    addAds : async(req,res) => {
        const { file, body: { name, link } } = req;
        console.log(file);

        try {
            let image;

            if (!file) return res.status(400).json({ errMsg: 'Image needed' });
            if (!name) return res.status(400).json({ errMsg: 'Name needed' });
            if (!link) return res.status(400).json({ errMsg: 'Link needed' });

            const mimeType = mime.lookup(file.originalname);
            if (mimeType && mimeType.includes("image/")) {
                const result = await cloudinary.uploader.upload(file?.path);
                image = result.secure_url;
                fs.unlinkSync(file.path);
            } else {
                fs.unlinkSync(file.path);
                return res.status(400).json({ status: false, errMsg: "File is not a image" });
            };

            const newAd = Ad.create({
                name,
                adLink:link,
                adImage:image
            });

            res.status(200)?.json({ newAd });

        } catch (error) {
           console.log(error); 
        }
    }
}