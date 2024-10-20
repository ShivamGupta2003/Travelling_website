const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      location: Joi.string().required(),
      country: Joi.string().required(),
      price: Joi.number().required().min(0),
      image: Joi.string().allow("", null),
      category: Joi.string().valid('Trending', 'Room', 'Iconic Cities', 'Mountain', 'Castles', 'Amazing Pools', 'Camping', 'Farms', 'Arctic').required() // Added category with valid options
    }).required()
  });
  


module.exports.reviewSchema  = Joi.object({
    review:Joi.object({
        rating:Joi.number().required().min(1).max(5),
        comment:Joi.string().required(),
    }).required(),
});


// >>>>>>>>>>>>..joi is npm package use for the schema vlidation in server side 
