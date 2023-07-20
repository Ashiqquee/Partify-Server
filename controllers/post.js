const Post = require('../models/post');
const cloudinary = require("cloudinary").v2;
const mime = require("mime-types");
const fs = require("fs");
let msg, errMsg;
const ObjectId = require('mongoose').Types.ObjectId;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
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
        
        try {
            
            const post = await Post.find().populate('providerId').populate('comments.userId').sort({ _id: -1 });
         
            return res.status(200).json({ post});
        } catch (error) {
            console.log(error);
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
        try {
            const { id } = req.payload;

            const posts = await Post.find({ providerId: id }).populate({
                path: 'providerId',
                select: 'name profilePic'
            }).populate({
                path: 'comments.userId',
                select: 'name image'
            }).sort({ _id: -1 });;

            return res.status(200).json({ posts })
        } catch (error) {
            console.log(error);
        }
    },

    likeOrUnlike: async(req,res) => {
        try {
            const { like, comment } = req.body;
            const { postId } = req.params;
            console.log(comment);
            console.log(postId);
            const post = await Post.findById(postId);

            if (like === 'yes') {
                const { id } = req.payload;
                post.likes.push(id)
                await post.save();
                res.status(200).json({ msg: 'success' })
            }
            if (like === 'no') {
                const { id } = req.payload;
                post.likes = post.likes.filter(likeId => likeId !== id)
                await post.save();
                res.status(200).json({ msg: 'success' })
            };

            if (comment === 'yes') {
                const { id } = req.payload;
                const { content } = req.body;
                const newComment = {
                    userId: id,
                    content
                };

                post.comments.push(newComment);
                await post.save();

                const updatedPost = await Post.findById(post._id).populate({
                  path:'comments.userId',
                  select:'name image'  
                }).populate({path:'providerId',select: 'name profilePic'}) ;

                res.status(200).json({ updatedPost })
            }
        } catch (error) {
            console.log(error);
        }
    },
    reportPost : async(req,res) => {
        try {
            const {id} = req.payload;
            const {postId} = req.params;
            console.log(id,postId);
            const post = await Post.findByIdAndUpdate(postId, { $addToSet: { reports: new ObjectId(id) } });
        
            return res.status(200).json({msg:'success'})
            

        } catch (error) {
            console.log(error);
        }
    },
   
}