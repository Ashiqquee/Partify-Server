const jwt = require('jsonwebtoken');
require('dotenv').config();
let errMsg;

module.exports = {
    
    generateToken: (id, role) => {
        const token = jwt.sign({ id, role }, process.env.JWT_SECRET);
        return token
    },

    verifyTokenUser: async (req, res, next) => {
        try {
            let token = req.headers['authorization'];
            
            if (!token) {
                return res.status(403).json({ errMsg: "Access Denied" });
            }

            if (token.startsWith('Bearer ')) {
                token = token.slice(7, token.length).trimLeft();

            }

            const verified = jwt.verify(token, process.env.JWT_SECRET);

            req.payload = verified;

            if (req.payload.role === 'user') {
                next()
            } else {
                return res.status(403).json({ errMsg: "Access Denied" });
            }
        } catch (err) {
            res.status(500).json({ errMsg: "Server Down" });
        }
    },


    verifyTokenProvider: async (req, res, next) => {
        try {
            let token = req.headers['authorization'];
            if (!token) {
                return res.status(403).json({ errMsg: "Access Denied" });
            }

            if (token.startsWith('Bearer ')) {
                token = token.slice(7, token.length).trimLeft();

            }

            const verified = jwt.verify(token, process.env.JWT_SECRET);

            req.payload = verified;
            
            
            if (req.payload.role === 'provider') {
                
                next()
            } else {
                return res.status(403).json({ eerrMsgrr: "Access Denied" });
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({ errMsg: "Server Down" });
        }
    },


    verifyTokenAdmin: async (req, res, next) => {
        try {
            

            let token = req.headers['authorization'];
            
            if (!token) {
                return res.status(403).json({ errMsg: "Access Denied" });
            }
          
        

            if (token.startsWith('Bearer ')) {
                token = token.slice(7, token.length).trimLeft();

            }
           

            const verified = jwt.verify(token, process.env.JWT_SECRET);
            
            req.payload = verified;
            if (req.payload.role === 'admin') {
                next()

            } else {
                return res.status(403).json({ errMsg: "Access Denied" });
            }
        } catch (err) {
            console.log("p");
            res.status(500).json({ errMsg: "Server Down" });
        }
    }


}