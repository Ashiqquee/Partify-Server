const express = require('express');
const { verifyTokenUser } = require('../middlewares/auth');
const { signup, login, editProfile, profile, googleLogin, userDetails, savePost, unsavePost, getSavedPosts } = require('../controllers/user');
const { posts, likeOrUnlike, reportPost } = require('../controllers/post');
const { providerList, singleProvider } = require('../controllers/provider');
const { userOrders, userSingleOrder,orderSuccess,paymentLink } = require('../controllers/order');
const { createChat, fetchUserChat, createMessage, getMessages } = require('../controllers/chat')
const multer = require('../config/multer');
const upload = multer.createMulter();
const userRouter = express.Router();


userRouter.post('/signup',signup);

userRouter.post('/login', login);

userRouter.post('/login/google', googleLogin);

userRouter.get('/profile',verifyTokenUser,profile)

userRouter.patch('/profile', upload.single('file'), verifyTokenUser, editProfile);

userRouter.get('/feed', posts);

userRouter.get('/details', verifyTokenUser, userDetails);

userRouter.get('/providersList', providerList);

userRouter.get('/orders', verifyTokenUser, userOrders);

userRouter.get('/order/:orderId', verifyTokenUser, userSingleOrder);

userRouter.post('/payment/:orderId',verifyTokenUser, paymentLink );

userRouter.get('/orderSuccess/:orderId', orderSuccess);

userRouter.patch('/post/:postId', verifyTokenUser, likeOrUnlike);

userRouter.post('/chat', verifyTokenUser, createChat);

userRouter.get('/chat', verifyTokenUser, fetchUserChat);

userRouter.post('/message', verifyTokenUser, createMessage);

userRouter.get('/message/:chatId', verifyTokenUser, getMessages);

userRouter.get('/pro/:providerId', singleProvider);

userRouter.patch('/savePost/:postId', verifyTokenUser,savePost);

userRouter.patch('/unsavePost/:postId',verifyTokenUser,unsavePost)

userRouter.patch('/report/:postId',verifyTokenUser,reportPost)

userRouter.get('/favPosts', verifyTokenUser, getSavedPosts)

module.exports = userRouter;