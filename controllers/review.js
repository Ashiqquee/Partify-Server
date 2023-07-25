const Review = require('../models/review');


module.exports = {
    addReview : async(req,res) => {
        try {
          const {providerId} = req.params;
          const {id} = req.payload;
          const {rating , message} = req.body.formData;
            
          const review = await Review.create({
            reviewContent:message,
            rating,
            providerId,
            userId:id,
          });

          console.log(review);

          res.status(200).json({msg:"Success"});

        } catch (error) {
           console.log(error); 
        }
    },
  getReview : async (req,res) => {
    try {
      const {providerId} = req.params;
      const reviews = await Review.find({providerId}).populate({
        path:'userId',
        select:'name image'
      });

      res.status(200).json({reviews});
    } catch (error) {
      console.log(error);
    }
  }
}