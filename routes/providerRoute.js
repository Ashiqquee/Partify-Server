const express = require('express');

const providerRouter = express.Router();
const { verifyTokenProvider } =  require('../middlewares/auth')
const { serviceList,signup,login,providerServices } = require('../controllers/provider')

providerRouter.get('/serviceList',serviceList);

providerRouter.post('/signup', signup);

providerRouter.post('/login',login);

providerRouter.get('/services', verifyTokenProvider, providerServices)

module.exports = providerRouter;