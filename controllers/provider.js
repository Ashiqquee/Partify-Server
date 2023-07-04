const Services = require('../models/service');
const Provider = require('../models/provider');
const sha256 = require('js-sha256');
const { generateToken } = require('../middlewares/auth');
const { addService } = require('./service');
const mongoose = require('mongoose');

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
            console.log(req.body);
            const provider = await Provider.findOne({phone});

            if (!provider) return res.status(401).json({ errMsg: "Provider not found" });

            const passwordCheck = await Provider.findOne({ phone, password: sha256(password + process.env.PASSWORD_SALT) });

            if (!passwordCheck) return res.status(401).json({ errMsg: "Password doesn't match" });

            if (!passwordCheck.adminConfirmed) return res.status(402).json({ errMsg: "Admin approval pending.." });

            if (passwordCheck.isBanned) return res.status(401).json({ errMsg: "You are blocked" });

            const token = generateToken(passwordCheck._id,'provider');

            res.status(200).json({ msg: 'Login succesfull', name: passwordCheck?.name, token, role: 'provider' })



        } catch (error) {
            console.log(error);
        }
    },

    providerList : async(req,res) => {
        try {
            const providerData = await Provider.find().populate('services');
         
            res.status(200).json({providerData});
        } catch (error) {
            console.log(error);
            res.status(500).json({ errMsg: 'Something went wrong' })
        }
    },

    confirmProvider : async(req,res) => {
        try {
            const {providerId} = req.params;
            console.log();
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
    }

}  