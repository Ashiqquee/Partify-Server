const Order = require('../models/order');
const User = require('../models/user');
const Provider = require('../models/provider');
const moment = require('moment');
const ObjectId = require('mongoose').Types.ObjectId;
let msg,errMsg;
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_KEY);

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

            const provider = await Provider.findById(id).select('places name');
            const serviceDistrict = provider.places[0].split(',').join();
           
           
           
            if (!serviceDistrict.includes('All Kerala') && !serviceDistrict.includes(district)) return res.status(400).json({errMsg:'You are not providing services to this district.Update your profile'});
       

            if(!user){
                return res.status(400).json({errMsg:"Mobile not found"})
            };

            const order = await Order.create({
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

            const newOrder = await Order.populate(order,{path:'customerId',select:'name'});

            const notification = {
                from :provider.name,
                content:"an order has been created"
            }

             user.notifications.push(notification);

             await user.save();
            return res.status(200).json({newOrder});

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


            return res.status(200).json({ order });
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

                success_url: `https://partify.shop/orderSuccess/${orderId}?wallet=${wallet}&selectedOption=${selectedOption}&stripe=yes`,
                cancel_url: `${process.env.FRONTEND_URL}payment/fail`,
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

            res.redirect(`${process.env.FRONTEND_URL}payment/success`);

        } catch (error) {
            console.log(error);
        }
    },
    editOrder:async(req,res) => {
        try {

            const {orderId} = req.params;

            const { cancel,completed,alternativePhone,eventDate,services,amount,street,city,zip,district} = req.body;

           

            const order = await Order.findById(orderId);

            if(cancel === 'yes'){
                order.status = 'cancelled by provider';
                await order.save();

                const userId = order.customerId.toString();

                const user = await User.findById(userId);

                user.wallet += order.totalAmount - order.remainingAmount;

                console.log(user.wallet);

                await user.save();
                
                return  res.status(200).json({msg:'edited successfully'});

            };

            if(completed === 'yes'){
                order.status = 'completed';
                await order.save();

                const providerId = order.providerId.toString();
                const provider = await Provider.findById(providerId);

                const amountToSend = Math.round((order.totalAmount - order.remainingAmount) * 0.95);

                provider.wallet += amountToSend;

                await provider.save();

                return res.status(200).json({ msg: ' done' });

            }
            
            let serviceId = services.map(service => service.value);
            order.alternativeNumber = alternativePhone;
            order.eventDate = eventDate;
            order.totalAmount = amount;
            order.services = serviceId;
            order.remainingAmount = amount;
            const address = order.address;
            address.zip = zip;
            address.street = street;
            address.city = city;
            address.district = district;

            await order.save();

            const updatedOrder = await Order.findById(orderId).populate('customerId').populate('providerId').populate('services');
            res.status(200).json({ msg: 'edited successfully', updatedOrder });

        } catch (error) {
            console.log(error);
        }
    },

    fullOrders: async(req,res) => {
        try {
            const orders = await Order.find().populate({
                path:'providerId',
                select:'name'
            }).sort({_id:-1});

            res.status(200).json({orders})
        } catch (error) {
            console.log(error);
        }
    },

    singleOrder: async(req,res) => {
        try {
            const { orderId } = req.params;

            if (ObjectId.isValid(orderId) === false) res.status(400).json({ errMsg: "Bad Request" });

            const order = await Order.findById(orderId).populate('customerId').populate('providerId').populate('services');


            return res.status(200).json({order})
        } catch (error) {
           console.log(error); 
        }
    },

    monthlySalesGraph: async (req, res) => {
        try {
            const {id} = req.payload;
            const getCurrentDate = () => moment().startOf('day').toDate();
            const getDate12MonthsAgo = () => moment().subtract(11, 'months').startOf('month').toDate();

            const completedOrders = await Order.find({
                status: 'completed',
                orderDate: {
                    $gte: getDate12MonthsAgo(),
                    $lte: getCurrentDate(),
                },
                'providerId':id
            });

            const allMonths = [];
            let lastYear = moment(getDate12MonthsAgo());
            const endDate = moment(getCurrentDate());

            while (lastYear.isBefore(endDate) || lastYear.isSame(endDate, 'month')) {
                allMonths.push(lastYear.format('YYYY-MM'));
                lastYear.add(1, 'month');
            }


            const monthlyData = {};
            allMonths.forEach(monthYear => {
                const monthName = moment(monthYear).format('MMM');
                monthlyData[monthYear] = { x: monthName, amount: 0 };
            });


            completedOrders.forEach(order => {
                const monthYear = moment(order.orderDate).format('YYYY-MM');
                monthlyData[monthYear].amount += order.totalAmount;
            });


            const result = Object.values(monthlyData);

            result.sort((a, b) => {
                const monthOrder = {
                    Jan: 1,
                    Feb: 2,
                    Mar: 3,
                    Apr: 4,
                    May: 5,
                    Jun: 6,
                    Jul: 7,
                    Aug: 8,
                    Sep: 9,
                    Oct: 10,
                    Nov: 11,
                    Dec: 12,
                };
                return monthOrder[a.x] - monthOrder[b.x];
            });

            totalRevenue = await Order.aggregate([
                {
                    $match: { providerId: new ObjectId(id) }
                },
                {
                    $group: {
                        _id: null,
                        totalAmountSum: { $sum: '$totalAmount' }
                    }
                }
            ])
 
            console.log(totalRevenue);
            return res.status(200).json({ result, totalRevenue });


        } catch (error) {
            console.log(error);
        }
    },

   
    

}