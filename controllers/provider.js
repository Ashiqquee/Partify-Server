const Services = require('../models/service');
const Provider = require('../models/provider');
const sha256 = require('js-sha256');
const { generateToken } = require('../middlewares/auth');
const mongoose = require('mongoose');
const cloudinary = require("cloudinary").v2;
const mime = require("mime-types");
const fs = require("fs");
const ObjectId = require('mongoose').Types.ObjectId;
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_KEY);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

let msg, errMsg;
module.exports = {

    signup: async (req, res) => {
        try {
            

            const { name, phone, password, services, places } = req.body;
            const lowerCaseName = name.toLowerCase();
            const exsistingUser = await Provider.findOne({ phone });

            if (exsistingUser) return res.status(409).json({ errMsg: 'Provider already found' });

            const newProvider = new Provider({
                name: lowerCaseName,
                phone,
                password: sha256(password + process.env.PASSWORD_SALT),
                services,
                places,
            });

            await newProvider.save();

            res.status(200).json({ msg: "Registration Success" });


        } catch (error) {
            res.status(500).json({ errMsg: 'Something went wrong' })

        }
    },

    login: async(req,res) => {
        try {
            
            const {phone,password} = req.body;
         
            const provider = await Provider.findOne({phone});

            if (!provider) return res.status(401).json({ errMsg: "Provider not found" });

            const passwordCheck = await Provider.findOne({ phone, password: sha256(password + process.env.PASSWORD_SALT) });

            if (!passwordCheck) return res.status(401).json({ errMsg: "Password doesn't match" });

            if (!passwordCheck.adminConfirmed) return res.status(402).json({ errMsg: "Admin approval pending.." });

            if (passwordCheck.isBanned) return res.status(401).json({ errMsg: "You are blocked" });

            const token = generateToken(passwordCheck._id,'provider');

            res.status(200).json({ msg: 'Login succesfull', name: passwordCheck?.name, token, role: 'provider', id: passwordCheck?._id })



        } catch (error) {
            console.log(error);
        }
    },

    providerList : async(req,res) => {
        try {
            const providerData = await Provider.find().populate('services').sort({isUpgraded:-1});
         
            res.status(200).json({providerData});
        } catch (error) {
            console.log(error);
            res.status(500).json({ errMsg: 'Something went wrong' })
        }
    },

    confirmProvider : async(req,res) => {
        try {
            const {providerId} = req.params;
           console.log(providerId+"pppp");
            const provider = await Provider.findById(providerId);

            if (!provider) return res.status(400).json({ errMsg: 'Provider Not Found' })

            provider.adminConfirmed = true;

            await provider.save();

            return res.status(200).json({ msg: 'Confirmed Successfully' })


        } catch (error) {
          console.log(error);  
            res.status(500).json({ errMsg: 'Something went wrong' })

        }
    },
    blockProvider: async (req, res) => {
        try {

            const { providerId } = req.params;
            
            const provider = await Provider.findById(providerId);

            if (!provider) return res.status(400).json({ errMsg: 'Provider Not Found' })

            provider.isBanned = true;

            await provider.save();

            return res.status(200).json({ msg: 'Unblocked Successfully' })

        } catch (error) {
            return res.status(500).json({ errMsg: 'Something went wrong' })
        }
    },

    unBlockProvider: async (req, res) => {
        try {

            const { providerId } = req.params;
            
            let provider = await Provider.findById(providerId);

            if (!provider) return res.status(400).json({ errMsg: 'Provider Not Found' })

            
            provider.isBanned = false;

            await provider.save();

            return res.status(200).json({ msg: 'Unblocked Successfully' })

        } catch (error) {
            return res.status(500).json({ errMsg: 'Something went wrong' });
            console.log(error);
        }
    },

    providerServices : async(req,res) => {
        try {

           
            const {id} = req.payload;

            const services = await Provider.findById(id).populate('services');
           
            const serviceList = services.services;

            const currentIds = services.services.map(obj => obj._id);

            const remainingServices = await Services.find({ _id: { $nin: currentIds } });

            res.status(200).json({ serviceList,remainingServices })
        } catch (error) {
            console.log(error);
        }
    },

    removeService : async (req,res) => {
        try {
            
          const {id} = req.payload;
          const {serviceId} = req.params;
          const provider =  await Provider.findById(id).populate('services');
            provider.services = provider.services.filter(obj => obj._id.toString() !== serviceId);
            await provider.save();
            const updatedService = provider.services;
            return res.status(200).json({ updatedService });
            
        } catch (error) {
            console.log(error);
            return res.status(500).json({ errMsg: 'Something went wrong' });
        }
    },

    addService : async(req,res) => {
        try {
        const {serviceId} = req.params;
        const { id } = req.payload;
        const provider = await Provider.findById(id);

            if (provider.services.includes(serviceId)){
                res.status(400).json({errMsg:"Service already added"});
            }

         provider.services.push(new mongoose.Types.ObjectId(serviceId));
        await provider.save();
        return res.status(200).json({msg:"New Service Added"});

        
        } catch (error) {
            console.log(error);
        }
    },

    providerProfile : async(req,res) => {
        try {
          const {id} = req.payload;
        
            

          const profile = await Provider.findById(id).populate('services');

       

          res.status(200).json({profile})
          
        } catch (error) {
            console.log(error);
        }
    },

    editProfile : async(req,res) => {
        try {
            const { id } = req.payload;

            const{file} = req;
           
            const {name,description,places,phone,dp} = req.body
          
            const provider = await Provider.findById(id);


            if(dp && file && file.filename){
              
                let image;
                const mimeType = mime.lookup(file.originalname);
                if (mimeType && mimeType.includes("image/")) {
                    const result = await cloudinary.uploader.upload(file.path);
                    image = result.secure_url;
                    fs.unlinkSync(file?.path);
                } else {
                    fs.unlinkSync(file?.path);
                    return res.status(400).json({ status: false, errMsg: "File is not a image" });
                };

                provider.profilePic = image;
                await provider.save();
                return res.status(200).json({ image });
            }
            if (!name || !description || !places || !phone) {
                return res.status(400).json({ errMsg: 'bad request' })
            }
            provider.name = name;
            provider.description = description;
            provider.places = places;
            provider.phone = phone;

            if(file && file.filename){
                let image;
                const mimeType = mime.lookup(file.originalname);
                if (mimeType && mimeType.includes("image/")) {
                    const result = await cloudinary.uploader.upload(file.path);
                    image = result.secure_url;
                    fs.unlinkSync(file?.path);
                } else {
                    fs.unlinkSync(file?.path);
                    return res.status(400).json({ status: false, errMsg: "File is not a image" });
                };
                provider.coverPic = image ;
            }
            await provider.save();
            const image = provider.coverPic;
            return res.status(200).json({ image })



        } catch (error) {
            console.log(error);
        }
    },

    singleProvider: async(req,res) => {
        try {
            const {providerId} = req.params;

            const provider = await Provider.findById(providerId).select('-password').populate('services');

            res.status(200).json({provider})

        } catch (error) {
            console.log(error);
        }
    },
    upgradePaymentLink : async(req,res) => {
        try {
            
            const {id} = req.payload;
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'inr',
                            product_data: {
                                name: 'Partify',
                            },
                            unit_amount: 399 * 100,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',

                success_url: `http://localhost:4000/provider/upgrade/${id}`,
                cancel_url: 'http://localhost:5173/payment/fail',
            });
            console.log(session.url);
            res.send({ url: session.url });
        } catch (error) {
            console.log(error);
        }
    },

    upgradeProvider : async(req,res) => {
        try {
            const {providerId} = req.params;

            const provider = await Provider.findById(providerId);

            provider.isUpgraded = true;

            await provider.save();

            res.redirect('http://localhost:5173/payment/success');

        } catch (error) {
            console.log(error);
        }
    },

    forgotPassword : async(req,res) => {
        try {
            console.log(req.body);
            const { check, phone, password } = req.body;

            if (check === 'yes') {
                const provider = await Provider.findOne({ phone });

                if (!provider) return res.status(400).json({ errMsg: "User not found" });

                return res.status(200).json({ msg: "User found" });
            };

            const user = await Provider.findOne({ phone });

            user.password = sha256(password + process.env.PASSWORD_SALT);

            await user.save();

            return res.status(200).json({ msg: "Password changed successfully" });


        } catch (error) {
            console.log(error);
        }
    }

    

  

}  