const Post = require('../models/post');
const cloudinary = require("../config/cloudinary");
const mime = require("mime-types");
const fs = require("fs");
let msg, errMsg;
const ObjectId = require('mongoose').Types.ObjectId;



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
           
        }
    },

    posts : async(req,res) => {
        
        try {
            const ITEMS_PER_PAGE = 10;
            const { page } = req.query;
            console.log(page);
            const currentPage = parseInt(page) || 1;
            const skipCount = (currentPage - 1) * ITEMS_PER_PAGE;

            const post = await Post.find().populate('providerId').populate('comments.userId').sort({ _id: -1 }).skip(skipCount).limit(ITEMS_PER_PAGE);
         
            return res.status(200).json({ post});
        } catch (error) {
           
            res.status(500).json({ errMsg: 'Server Error' });

        }
    },

    

    deletePost : async(req,res) => {
        
        try {
            const {postId} = req.params;
            
            await Post.findByIdAndDelete(postId);
            
           res.status(200).json({msg:"post deleted"});

        } catch (error) {
           
            res.status(500).json({ errMsg: 'Server Error' });

        }
    },
    providerPost : async(req,res) => {
        try {
            const { id } = req.payload;

            const posts = await Post.find({ providerId: id }).populate({
                path: 'providerId',
                select: 'name profilePic isUpgraded'
            }).populate({
                path: 'comments.userId',
                select: 'name image'
            }).sort({ _id: -1 });;

            return res.status(200).json({ posts })
        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });

        }
    },

    likeOrUnlike: async(req,res) => {
        try {
            const { like, comment } = req.body;
            const { postId } = req.params;
            
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
            res.status(500).json({ errMsg: "Something went wrong" });

        }
    },
    reportPost : async(req,res) => {
        try {
            const {id} = req.payload;
            const {postId} = req.params;
            
            const post = await Post.findByIdAndUpdate(postId, { $addToSet: { reports: new ObjectId(id) } });
        
            return res.status(200).json({msg:'success'})
            

        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });
        }
    },
    postByProvider: async (req, res) => {
        try {
            const { providerId } = req.params;

            const posts = await Post.find({ providerId}).populate({
                path: 'providerId',
                select: 'name profilePic isUpgraded'
            }).populate({
                path: 'comments.userId',
                select: 'name image'
            }).sort({ _id: -1 });;

            return res.status(200).json({ posts })
        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });

        }
    },
   totalInteraction : async(req,res) => {
    try {

        const {id} = req.payload;
        const posts = await Post.find({ providerId: id });

        if(posts){
            const likes = posts.map((post) => post.likes);
            const comments = posts.map((post) => post.comments);
            
            const interaction = likes?.flat()?.length + comments?.flat()?.length;
            return res.status(200).json({ interaction })

        }

    } catch (error) {
        res.status(500).json({ errMsg: "Something went wrong" });

    }
   },

    mostInteractedPost : async(req,res) => {
    try {

        const {id} = req.payload;

        const mostInteractedPost = await Post.aggregate([
            {
                $match: {
                    providerId: new ObjectId(id)
                }
            },
            {
                $project: {
                    _id: 1,
                    likes: 1,
                    comments: 1,
                    num_likes: { $size: "$likes" },
                    num_comments: { $size: "$comments" }
                }
            },
            {
                $group: {
                    _id: "$_id",
                    max_likes: { $max: "$num_likes" },
                    max_comments: { $max: "$num_comments" }
                }
            },
            {
                $sort: {
                    max_likes: -1,
                    max_comments: -1
                }
            },
            {
                $limit: 3
            }
        ]);

        const postIds = mostInteractedPost.map(post => post._id);
     

        const posts = await Post.find({ _id: { $in: postIds } }, { postImages: 1, createdAt: 1 });
        


        res.status(200).json({posts});

    } catch (error) {
        res.status(500).json({ errMsg: "Something went wrong" });

    }
   }
}