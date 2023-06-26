const express = require('express');
const multer = require('../config/multer');
const upload = multer.createMulter();
const { verifyTokenAdmin } = require('../middlewares/auth');
const {allUser} = require('../controllers/user')
const { login, } = require('../controllers/admin');
const { addService, serviceList } = require('../controllers/service');

const adminRouter = express.Router();

adminRouter.post('/login',login);

adminRouter.get('/serviceList',verifyTokenAdmin,serviceList);

adminRouter.post('/addService', upload.single('file'), verifyTokenAdmin,addService);

adminRouter.get('/userList',verifyTokenAdmin,allUser)

module.exports = adminRouter;