const express = require('express');

const providerRouter = express.Router();
const { verifyTokenProvider } =  require('../middlewares/auth')
const { signup, login, providerServices, removeService, addService } = require('../controllers/provider')
const { serviceList } = require('../controllers/service')

providerRouter.get('/serviceList', serviceList);

providerRouter.post('/signup', signup);

providerRouter.post('/login',login);

providerRouter.get('/services', verifyTokenProvider, providerServices);

providerRouter.patch('/removeService/:serviceId', verifyTokenProvider, removeService);

providerRouter.patch('/addService/:serviceId', verifyTokenProvider, addService)

module.exports = providerRouter;