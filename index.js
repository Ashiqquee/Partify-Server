const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const multer = require('multer')
require('dotenv').config();

const index = express();

const adminRouter = require('./routes/adminRoute');
const providerRouter = require('./routes/providerRoute')
const userRouter = require('./routes/userRoute');
const connectDB = require('./config/dbConnect')


index.use(morgan("dev"));
index.use(express.json());
index.use(morgan('tiny'));
index.use(express.urlencoded({ limit: "30mb", extended: true }));
index.use(cors());
index.use(cookieParser());

index.use("/", userRouter);
index.use("/provider",providerRouter);
index.use("/admin", adminRouter);


connectDB();


index.listen(process.env.PORT,() => console.log("Server connected 3000"));

