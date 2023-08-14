const Ad = require('../models/ads');
const cloudinary = require("../config/cloudinary");
const mime = require("mime-types");
const fs = require("fs");
let msg, errMsg;



module.exports = {
    adsList : async(req,res) => {
        try {
            const adsList = await Ad.find().sort({_id:-1});

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

            const newAd =await Ad.create({
                name,
                adLink:link,
                adImage:image
            });
            console.log(newAd);

            res.status(200)?.json({ newAd });

        } catch (error) {
           console.log(error); 
        }
    },

    deleteAd : async(req,res) => {
        try {
            const {adId} = req.params;
            await Ad.findByIdAndDelete(adId);
            res.status(200).json({msg:"success"});
            
        } catch (error) {
            console.log(error);
        }
    }
}