const User = require('../models/user');
const sha256 = require('js-sha256');
const { generateToken } = require('../middlewares/auth');
const cloudinary = require("cloudinary").v2;
let msg, errMsg;
const mime = require("mime-types");
const fs = require("fs");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = {
    signup: async (req, res) => {
        try {
            const { name, email, phone, password,referalCode } = req.body;
            const exsistingUser = await User.findOne({ $or: [{ email }, { phone }] });
            console.log(exsistingUser);
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

            const exsistingUser = await User.findOne({ phone, });

            if (!exsistingUser) return res.status(401).json({ errMsg: "User not found" });

            const passwordCheck = await User.findOne({ phone, password: sha256(password + process.env.PASSWORD_SALT) });

            if (!passwordCheck) return res.status(401).json({ errMsg: "Password doesn't match" });

            if(passwordCheck.isBanned) return res.status(401).json({errMsg:"You are blocked"});


            const token = generateToken(passwordCheck._id, 'user');

            res.status(200).json({ msg: 'Login succesfull', name: passwordCheck?.name, token, role: 'user', id: passwordCheck._id })



        } catch (error) {
            console.log(error);
        }
    },
    googleLogin: async(req,res) => {
        try {
           const {userEmail} = req.body;
            
           const user = await User.findOne({email:userEmail});

           console.log(user);

           if(!user) return res.status(402).json({errMsg:'User not found'});

           const token = generateToken(user._id, 'user');


            return res.status(200).json({ name: user?.name, token, role: 'user', id:user?._id});
           
        } catch (error) {
            
        }
    },

    allUser: async (req, res) => {
        try {
            const userData = await User.find();
            res.status(200).json({ userData });
        } catch (error) {
            console.log(error);
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
            console.log(error);
            return res.status(500).json({ errMsg: 'Something went wrong' })

        }
    },

    profile:async(req,res) => {
        try {
        const {id} = req.payload;
        const user = await User.findById(id);
        res.status(200).json({user});
        } catch (error) {
            console.log(error);
            return res.status(500).json({ errMsg: 'Something went wrong' })

        }
    }
}