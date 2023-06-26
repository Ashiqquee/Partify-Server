const express = require('express');
const { verifyTokenUser } = require('../middlewares/auth');
const controller = require('../controllers/user');
const { signup, login } = controller;

const userRouter = express.Router();


userRouter.post('/signup',signup);
userRouter.post('/login', login);



module.exports = userRouter;