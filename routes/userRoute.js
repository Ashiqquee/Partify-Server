const express = require('express');
const { verifyTokenUser } = require('../middlewares/auth');
const { signup, login, editProfile, profile, } = require('../controllers/user');
const { feed } = require('../controllers/post');
const {providerList} = require('../controllers/provider')
const multer = require('../config/multer');
const upload = multer.createMulter();

const userRouter = express.Router();


userRouter.post('/signup',signup);

userRouter.post('/login', login);

userRouter.get('/profile',verifyTokenUser,profile)

userRouter.patch('/profile', upload.single('file'), verifyTokenUser, editProfile);

userRouter.get('/feed',feed);

userRouter.get('/providersList', providerList)



module.exports = userRouter;