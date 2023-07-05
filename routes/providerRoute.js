const express = require('express');

const providerRouter = express.Router();
const multer = require('../config/multer');
const upload = multer.createMulter();
const { verifyTokenProvider } =  require('../middlewares/auth');
const { signup, login, providerServices, removeService, addService } = require('../controllers/provider');
const { serviceList } = require('../controllers/service');
const {addPost} = require('../controllers/post')

providerRouter.get('/serviceList', serviceList);

providerRouter.post('/signup', signup);

providerRouter.post('/login',login);

providerRouter.get('/services', verifyTokenProvider, providerServices);

providerRouter.patch('/removeService/:serviceId', verifyTokenProvider, removeService);

providerRouter.patch('/addService/:serviceId', verifyTokenProvider, addService);

providerRouter.post('/post', upload.array("file", 5),verifyTokenProvider,addPost);

module.exports = providerRouter;