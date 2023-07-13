const express = require('express');
const { verifyTokenUser } = require('../middlewares/auth');
const { signup, login, editProfile, profile, } = require('../controllers/user');
const { posts } = require('../controllers/post');
const {providerList} = require('../controllers/provider');
const { userOrders, userSingleOrder,orderSuccess,paymentLink } = require('../controllers/order')
const multer = require('../config/multer');
const upload = multer.createMulter();

const userRouter = express.Router();


userRouter.post('/signup',signup);

userRouter.post('/login', login);

userRouter.get('/profile',verifyTokenUser,profile)

userRouter.patch('/profile', upload.single('file'), verifyTokenUser, editProfile);

userRouter.get('/feed', posts);

userRouter.get('/providersList', providerList);

userRouter.get('/orders', verifyTokenUser, userOrders);

userRouter.get('/order/:orderId', verifyTokenUser, userSingleOrder);

userRouter.post('/payment/:orderId',verifyTokenUser, paymentLink );

userRouter.get('/orderSuccess/:orderId', orderSuccess)


module.exports = userRouter;