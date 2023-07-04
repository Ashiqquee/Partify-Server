const User = require('../models/user');
const sha256 = require('js-sha256');
const { generateToken } = require('../middlewares/auth');
let msg, errMsg;

module.exports = {
    signup: async (req, res) => {
        try {
            const { name, email, phone, password } = req.body;
            const exsistingUser = await User.findOne({ $or: [{ email }, { phone }] });
            console.log(exsistingUser);
            if (exsistingUser) return res.status(409).json({ errMsg: "User already found" });

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

            res.status(200).json({ msg: 'Login succesfull', name: passwordCheck?.name, token, role: 'user' })



        } catch (error) {
            console.log(error);
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
}