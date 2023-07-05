const express = require('express');
const multer = require('../config/multer');
const upload = multer.createMulter();
const { verifyTokenAdmin } = require('../middlewares/auth');
const {allUser,unBlockUser,blockUser} = require('../controllers/user')
const { login, } = require('../controllers/admin');
const { addService, serviceList, editServices } = require('../controllers/service');
const { providerList, confirmProvider ,blockProvider,unBlockProvider} = require('../controllers/provider')

const adminRouter = express.Router();  

adminRouter.post('/login',login);

adminRouter.get('/serviceList',verifyTokenAdmin,serviceList);

adminRouter.post('/addService', upload.single('file'), verifyTokenAdmin,addService);

adminRouter.get('/userList',verifyTokenAdmin,allUser);

adminRouter.patch('/blockUser/:userId', verifyTokenAdmin, blockUser);
 
adminRouter.patch('/unBlockUser/:userId', verifyTokenAdmin, unBlockUser);

adminRouter.get('/providerList', verifyTokenAdmin, providerList);

adminRouter.patch('/confirmProvider/:providerId', verifyTokenAdmin, confirmProvider);


adminRouter.patch('/blockProvider/:providerId', verifyTokenAdmin, blockProvider);

adminRouter.patch('/unBlockProvider/:providerId', verifyTokenAdmin, unBlockProvider);

adminRouter.patch('/services', upload.single('file'), verifyTokenAdmin, editServices)

module.exports = adminRouter;