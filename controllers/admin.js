const { generateToken } = require('../middlewares/auth');
const User = require('../models/user');
const Provider = require('../models/provider');
const Order = require('../models/order');
const moment = require('moment');
let msg,errMsg;

module.exports = {

    login : async(req,res) => {
        const {phone,password} = req.body;

        if (phone.trim() !== process.env.ADMIN_NUMBER.trim()) return res.status(401).json({errMsg:"Number not found"});
       
        if (phone.trim() !== process.env.ADMIN_NUMBER.trim() || process.env.ADMIN_PASSWORD.trim() !== password.trim()) {
            return res.status(401).json({errMsg:"Password incorrect"});
        };

        const token = generateToken(phone,'admin');
        res.status(200).json({msg:'login succesfull',name:'ashiqquee',token,role:'admin'});

    },

    dashboard: async(req,res) => {
        try {
        const totalUsers = await User.countDocuments() ;

        const totalProviders = await Provider.countDocuments();
        
        const totalOrders = await Order.countDocuments({
                $or: [
                    { 'order.status': 'confirmed' },
                    { 'order.status': 'completed' }
                ]
            });

     
            // const amount = await Order.aggregate([
            //     {
            //         $match: {
            //             status: 'completed'
            //         }
            //     },
            //     {
            //         $group: {
            //             _id: null,
            //             sum: { $sum: '$totalAmount' }
            //         }
            //     }
            // ]);

            // const totalAmount = amount[0].sum;
            
            

            res.status(200).json({ totalUsers, totalProviders, totalOrders  })


        } catch (error) {
            
        }
    },

    monthlySalesGraph: async(req,res) => {
        try {
            const getCurrentDate = () => moment().startOf('day').toDate();
            const getDate12MonthsAgo = () => moment().subtract(11, 'months').startOf('month').toDate();

            const completedOrders = await Order.find({
                status: 'completed',
                orderDate: {
                    $gte: getDate12MonthsAgo(),
                    $lte: getCurrentDate(),
                },
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
         
            return res.status(200).json({result})

        } catch (error) {
            console.log(error);
        }
    },

    frequentProviders: async (req, res) => {
        try {
            const pipeline = [
              
                { $match: { status: 'completed' } },
          
                {
                    $group: {
                        _id: '$providerId',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
               
                { $limit: 4 },
                
            
            ];

            
            const result = await Order.aggregate(pipeline);

            const providerIds = result.map((item) => item._id);
            const mostFrequentProviders = await Provider.find({ _id: { $in: providerIds } }, { name: 1, profilePic: 1 });

         
        
            return res.status(200).json({mostFrequentProviders});

        } catch (error) {
            console.log(error);
        }
    },
    
    
}