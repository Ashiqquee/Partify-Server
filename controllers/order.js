const Order = require('../models/order');
const User = require('../models/user')
const ObjectId = require('mongoose').Types.ObjectId;
let msg,errMsg;
const Stripe = require('stripe')
const stripe = Stripe('sk_test_51NT2kqSHi3MXzUyUkZMxNjNq5t5k9pDrY0KbzU45sWcKHhd1AiPvEImpJraqCSB1Zo7Al8YprKQU0oViIqpYPHn200vM19OIVB')

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
                remainingAmount: amount,
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
    },

    providerSingleOrder: async(req,res) => {

       try {
           const { orderId } = req.params;

           if (ObjectId.isValid(orderId) === false) res.status(400).json({ errMsg: "Bad Request" })

           const { id } = req.payload;

           const order = await Order.findById(orderId).populate('customerId').populate('providerId').populate('services');

           if (!order) return res.status(400).json({ errMsg: "Bad Request" })

       
           if (order.providerId?._id?.toString() !== id) return res.status(400).json({ errMsg: "Bad Request" });

       
           return res.status(200).json({ order })
       } catch (error) {
        console.log(error);
       }

    },

    userOrders : async(req,res) => {
        try {
            const { id } = req.payload;
            const orders = await Order.find({ customerId: id }).populate('providerId').populate('services');
            res.status(200).json({ orders });
        } catch (error) {
            
        }
    },

    userSingleOrder: async (req, res) => {

        try {
            const { orderId } = req.params;

            if (ObjectId.isValid(orderId) === false) res.status(400).json({ errMsg: "Bad Request" })

            const { id } = req.payload;

            const order = await Order.findById(orderId).populate('customerId').populate('providerId').populate('services');

            if (!order) return res.status(400).json({ errMsg: "Bad Request" })

            console.log(order.customerId?._id?.toString() === id);
            if (order.customerId?._id?.toString() !== id) return res.status(400).json({ errMsg: "Bad Request" });


            return res.status(200).json({ order })
        } catch (error) {
            console.log(error);
        }

    },
    paymentLink: async (req, res) => {
        try {
            
            const {orderId} = req.params;
            const { wallet, selectedOption } = req.body;
           
            let amount;
            const order = await Order.findById(orderId).populate('providerId');
            
            if (selectedOption === 'advanceAmount'){
               
                amount = order.advanceAmount - wallet;
  
            } else {
                amount = order.remainingAmount - wallet
            };
            
            if(amount <= 0){
                return res.status(400).json({errMsg:'Amount  is less than 0'})
            } 

            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'inr',
                            product_data: {
                                name: order?.providerId.name,
                            },
                            unit_amount: amount*100,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',

                success_url: `http://localhost:4000/orderSuccess/${orderId}?wallet=${wallet}&selectedOption=${selectedOption}&stripe=yes`,
                cancel_url: 'http://localhost:5173/payment/fail',
            });

            res.send({ url: session.url });
        } catch (error) {
            console.log(error);
        }
    },

    orderSuccess : async (req,res) => {
        try {
            const {orderId} = req.params;
            const { wallet, selectedOption, stripe } = req.query;
            console.log(wallet,selectedOption);
            const order = await Order.findById(orderId);

            order.remainingAmount = (selectedOption === 'fullAmount' ? 0 : order?.totalAmount - order?.advanceAmount);
            console.log(order.remainingAmount);
            order.advancePaymentDate = Date.now();

            order.status = 'confirmed';

            order.walletAmount = order.walletAmount+wallet;

            await order.save();

            let userId = order.customerId.toString();

            const user = await User.findByIdAndUpdate(userId, { $inc: { wallet: -wallet } }, { new: true });

            if (stripe === 'no')  return res.status(200).json({msg:'order confirmed'})

            res.redirect('http://localhost:5173/payment/success');

        } catch (error) {
            console.log(error);
        }
    }

    

}