const Order = require('../models/order');
const User = require('../models/user')

let msg,errMsg;

module.exports = {
    providerOrder : async(req,res) => {
        try {
            const {id} = req.payload;

            
            const orders = await Order.find({ providerId: id }).populate('customerId').populate('services');

           res.status(200).json({orders})
        } catch (error) {
            
           console.log(error);
        }
    },

    newOrder:async(req,res) => {
        try {
            
            const {id} = req.payload;
            const { phone, alternativePhone, services, advanceAmount,amount,eventDate,street,zip,city,district} = req.body;
            const serviceIds = services.map(service => service.value);

            const user = await User.findOne({phone});

            if(!user){
                return res.status(400).json({errMsg:"Mobile not found"})
            };

            const order = new Order({
                customerId:user._id,
                providerId:id,
                alternativeNumber: alternativePhone,
                status:'pending',
                services:serviceIds,
                advanceAmount,
                totalAmount: amount,
                eventDate,
                address:{
                    street,
                    city,
                    district,
                    zip,
                }
            });

            await order.save();
            return res.status(200).json({msg:"Order successfully created"});

        } catch (error) {
           console.log(error); 
        }
    }

}