const express = require('express');

const providerRouter = express.Router();
const multer = require('../config/multer');
const upload = multer.createMulter();
const { verifyTokenProvider } =  require('../middlewares/auth');
const { signup, login, providerServices, removeService, addService, providerProfile, editProfile, upgradePaymentLink,upgradeProvider } = require('../controllers/provider');
const { serviceList } = require('../controllers/service');
const { addPost, providerPost, deletePost } = require('../controllers/post');
const { providerOrder, newOrder, providerSingleOrder,editOrder,monthlySalesGraph } = require('../controllers/order')
const { fetchProviderChat, getMessages, createMessage } = require('../controllers/chat')
providerRouter.get('/serviceList', serviceList);

providerRouter.post('/signup', signup);

providerRouter.post('/login',login);

providerRouter.get('/services', verifyTokenProvider, providerServices);

providerRouter.patch('/removeService/:serviceId', verifyTokenProvider, removeService);

providerRouter.patch('/addService/:serviceId', verifyTokenProvider, addService);

providerRouter.post('/post', upload.array("file", 5),verifyTokenProvider,addPost);

providerRouter.get('/post',verifyTokenProvider,providerPost);

providerRouter.get('/profile', verifyTokenProvider, providerProfile);

providerRouter.patch('/profile', upload.single('file'), verifyTokenProvider, editProfile);

providerRouter.get('/orders', verifyTokenProvider, providerOrder);

providerRouter.post('/orders', verifyTokenProvider, newOrder);

providerRouter.get('/order/:orderId', verifyTokenProvider, providerSingleOrder);

providerRouter.patch('/order/:orderId', verifyTokenProvider, editOrder);

providerRouter.delete('/post/:postId',verifyTokenProvider,deletePost);

providerRouter.post('/message', verifyTokenProvider, createMessage);

providerRouter.get('/chat', verifyTokenProvider, fetchProviderChat);

providerRouter.get('/message/:chatId', verifyTokenProvider, getMessages);

providerRouter.post('/payment', verifyTokenProvider, upgradePaymentLink);

providerRouter.get('/upgrade/:providerId', upgradeProvider);

providerRouter.get('/dashboard',verifyTokenProvider, monthlySalesGraph);



module.exports = providerRouter;