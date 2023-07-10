const express = require('express');

const providerRouter = express.Router();
const multer = require('../config/multer');
const upload = multer.createMulter();
const { verifyTokenProvider } =  require('../middlewares/auth');
const { signup, login, providerServices, removeService, addService, providerProfile, editProfile } = require('../controllers/provider');
const { serviceList } = require('../controllers/service');
const { addPost,  providerPost } = require('../controllers/post')

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



module.exports = providerRouter;