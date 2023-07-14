const Post = require('../models/post');
const cloudinary = require("cloudinary").v2;
const mime = require("mime-types");
const fs = require("fs");
let msg, errMsg;

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
});

module.exports = {
    addPost: async(req,res) => {
        const { files, body: { caption, tagline } } = req;
        const { id } = req.payload;
        try {
            if (!files || !caption) return res.status(400).json({ errMsg: "Fill the form" });

            let postImages = [];

            if (files) {
                for await (const file of files) {
                    const mimeType = mime.lookup(file.originalname);
                    if (mimeType && mimeType.includes("image/")) {
                        const result = await cloudinary.uploader.upload(file.path);
                        postImages.push(result.secure_url);
                        fs.unlinkSync(file.path);
                    };
                };
            };

            const post = new Post({
                providerId: id,
                caption,
                tagline,
                postImages,
            });

            await post.save();
            res.status(200).json({msg:"post added"})
        } catch (error) {
            res.status(500).json({ errMsg: 'Server Error' });
            console.log(error);
        }
    },

    posts : async(req,res) => {
        console.log("ok");
        try {
            const post = await Post.find().populate('providerId').sort({ _id: -1 });
         
            return res.status(200).json({ post });
        } catch (error) {
            res.status(500).json({ errMsg: 'Server Error' });

        }
    },

    deletePost : async(req,res) => {
        
        try {
            const {postId} = req.params;
            
            
           await Post.findByIdAndDelete(postId);

            return res.status(200).json({msg:"Deleted"});

        } catch (error) {
            console.log(error);
            res.status(500).json({ errMsg: 'Server Error' });

        }
    },
    providerPost : async(req,res) => {
        const {id} = req.payload;

        const posts = await Post.find({ providerId: id }).populate('providerId').sort({ _id: -1 });;

        return res.status(200).json({posts})
    }
   
}