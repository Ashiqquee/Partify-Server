const User = require('../models/user');
const sha256 = require('js-sha256');
const { generateToken } = require('../middlewares/auth');
const cloudinary = require('../config/cloudinary');
let msg, errMsg;
const mime = require("mime-types");
const fs = require("fs");


module.exports = {
    signup: async (req, res) => {
        try {
            const { name, email, phone, password,referalCode } = req.body;
            
            const exsistingUser = await User.findOne({ $or: [{ email }, { phone }] });
            
            if (exsistingUser) return res.status(409).json({ errMsg: "User already found" });

            if(referalCode){
                const referealUser = await User.findOne({referalNumber:referalCode});
                if(!referealUser) return res.status(200).json({errMsg:"Invalid referal code"});

                referealUser.wallet += 100;
                
                await referealUser.save()
            }

            const timestamp = Date.now();
            const randomNum = Math.floor(Math.random() * 1000);

            const timestampPart = timestamp.toString().slice(-4);
            const randomNumPart = randomNum.toString().padStart(3, '0');

            const referalNumber = `#${timestampPart}${randomNumPart}`;
            const newUser = new User({
                name,
                phone,
                email,
                password: sha256(password + process.env.PASSWORD_SALT),
                referalNumber
            })
            await   newUser.save();

            res.status(200).json({ msg: "Registration Success" });
        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });
        }
    },

    login: async (req, res) => {
        try {
            const { phone, password } = req.body;
            const users = await User.find();
            
            const exsistingUser = await User.findOne({ phone, });

            if (!exsistingUser) return res.status(401).json({ errMsg: "User not found" });

            const passwordCheck = await User.findOne({ phone, password: sha256(password + process.env.PASSWORD_SALT) });

            if (!passwordCheck) return res.status(401).json({ errMsg: "Password doesn't match" });

            if(passwordCheck.isBanned) return res.status(401).json({errMsg:"You are blocked"});


            const token = generateToken(passwordCheck._id, 'user');

            res.status(200).json({ msg: 'Login succesfull', name: passwordCheck?.name, token, role: 'user', id: passwordCheck._id })



        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });
            
        }
    },
    googleLogin: async(req,res) => {
        try {
           const {userEmail} = req.body;
            
           const user = await User.findOne({email:userEmail});


           if(!user) return res.status(402).json({errMsg:'User not found'});

           if (user.isBanned) return res.status(401).json({ errMsg: "User Blocked" });


           const token = generateToken(user._id, 'user');


            return res.status(200).json({ name: user?.name, token, role: 'user', id:user?._id});
           
        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });

        }
    },

    allUser: async (req, res) => {
        try {
            const userData = await User.find();
            res.status(200).json({ userData });
        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });
            
        }
    },

    blockUser: async (req, res) => {
        try {

            const { userId } = req.params;

            const user = await User.findById(userId);

            if (!user) return res.status(400).json({ errMsg: 'User Not Found' })

            user.isBanned = true;

            user.save();

            return res.status(200).json({ msg: 'Unblocked Successfully' })

        } catch (error) {
            return res.status(500).json({ errMsg: 'Something went wrong' })
        }
    },

    unBlockUser: async (req, res) => {
        try {

            const { userId } = req.params;

            let user = await User.findById(userId);

            if (!user) return res.status(400).json({ errMsg: 'User Not Found' })


            user.isBanned = false;

            user.save();

            return res.status(200).json({ msg: 'Unblocked Successfully' })

        } catch (error) {
            return res.status(500).json({ errMsg: 'Something went wrong' })

        }
    },

    editProfile: async(req,res) => {
        try {
            const { id } = req.payload;
            const user = await User.findById(id);

            const {file} = req;
            if (file && file.filename){
                let image;
                const mimeType = mime.lookup(file.originalname);
                if (mimeType && mimeType.includes("image/")) {
                    const result = await cloudinary.uploader.upload(file.path);
                    image = result.secure_url;
                    fs.unlinkSync(file?.path);
                } else {
                    fs.unlinkSync(file?.path);
                    return res.status(400).json({ errMsg: "File is not a image" });
                };

                user.image = image;
                await user.save();
                return res.status(200).json({image});
            }
          
            const {name,place,email,phone} = req.body;

        
            user.name = name;
            user.place = place;
            user.phone = phone;
            user.email=email;

            await user.save()
            return res.status(200).json({ msg: "Pofile Updated " });






        } catch (error) {
            return res.status(500).json({ errMsg: 'Something went wrong' })

        }
    },

    profile:async(req,res) => {
        try {
        const {id} = req.payload;
        const user = await User.findById(id);
        res.status(200).json({user});
        } catch (error) {
            return res.status(500).json({ errMsg: 'Something went wrong' })

        }
    },
    userDetails: async (req, res) => {
        try {
            const {id} = req.payload;
            const user = await User.findById(id).select('image likedPost');
            res.status(200).json({user})
        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });
            
        }
    },

    savePost : async(req,res) => {
        try {
            const {id} = req.payload;
            const {postId} = req.params;
            const user = await User.findById(id)

            user.likedPost.push(postId);

            await user.save();

            const likedPost = user.likedPost;
            res.status(200).json({ likedPost });

        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });
            
        }
    },
    unsavePost : async(req,res) => {
        try {
            const { id } = req.payload;
            const { postId } = req.params;
            const user = await User.findById(id);

            const updatedLikedPost = user.likedPost.filter((likedPostId) => likedPostId.toString() !== postId);
            user.likedPost = updatedLikedPost;

            await user.save();

            const likedPost = user.likedPost;

            res.status(200).json({ likedPost });

        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });
            
        }
    },

    getSavedPosts : async(req,res) => {
        try {
            const {id} = req.payload;

            const user = await User.findById(id).populate({
                path: 'likedPost',
                populate: {
                    path: 'providerId',
                    model: 'provider'
                }
            })

            const posts = user.likedPost;
            
            const notification = user.notifications.reverse();




            res.status(200).json({posts,notification})
        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });
            
        }
    },

    forgotPassword : async(req,res) => {
        try {
      
            const {check,phone,password} = req.body;
     
            if(check === 'yes'){
                const user = await User.findOne({phone});

                if(!user) return res.status(400).json({errMsg:"User not found"});

                if (user.isBanned) return res.status(401).json({ errMsg: "User Blocked" });

                return res.status(200).json({msg:"User found"});
            };

            const user = await User.findOne({phone});

            user.password = sha256(password + process.env.PASSWORD_SALT);

            await user.save();

            return res.status(200).json({msg:"Password changed successfully"});


        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });
            
        }
    }
}