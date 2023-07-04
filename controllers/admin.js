const { generateToken } = require('../middlewares/auth');
let msg,errMsg;

module.exports = {
    login : async(req,res) => {
        const {phone,password} = req.body;

        if (phone.trim() !== process.env.ADMIN_NUMBER.trim()) return res.status(401).json({errMsg:"Number not found"});
       
        if (phone.trim() !== process.env.ADMIN_NUMBER.trim() || process.env.ADMIN_PASSWORD.trim() !== password.trim()) {
            return res.status(401).json({errMsg:"Password incorrect"});
        };

        const token = generateToken(phone,'admin');
        res.status(200).json({msg:'login succesfull',name:'ashiqquee',token,role:'admin'});

    },



   

    
}