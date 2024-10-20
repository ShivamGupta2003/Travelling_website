const mongoose = require("mongoose");
const Schema = mongoose.Schema;
  const  Review = require("./review.js");
const listingSchema = new Schema({

    title:{
        type :String,
        required:true ,

    },
    description:String,
     image:{
        // type :String,
        // default:"https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-nature-mountain-scenery-with-flowers-free-photo.jpg?w=1024&quality=50",
        
        // set:(v)=> v===""?"https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-nature-mountain-scenery-with-flowers-free-photo.jpg?w=1024&quality=50":v
        url :String,
        filename:String,

     },
   
     price:Number ,
     location:String ,
     country :String,
     reviews:[
        {
            type:Schema.Types.ObjectId,
            ref:"Review",
        },
      ],
      owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
      },
      category: {
        type: String,
        enum: ['Trending', 'Room', 'Iconic Cities', 'Mountain', 'Castles', 'Amazing Pools', 'Camping', 'Farms', 'Arctic'], // predefined categories
        required: true,
      },
      

});

listingSchema.post("findOneAndDelete", async (listing) => {

    if(listing){
      await Review.deleteMany({_id:{ $in: listing.reviews}});
  
    }
  
  });
const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
