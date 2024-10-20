const Listing = require("./models/listing");
const review = require("./models/review");
 const Review = require("./models/review");


module.exports.isLoggedIn=(req, res, next )=>{
    if(!req.isAuthenticated()){
        req.session.RedirectUrl = req.originalUrl;
        req.flash("error","you must be loggedIn first ");
         return   res.redirect("/login");
      }
      next();
}
module.exports.savedRedirectUrl =(req, res, next)=>{
    if(req.session.RedirectUrl){
        res.locals.redirectUrl = req.session.RedirectUrl;
    }
    next();
};

 module.exports.isOwner = async(req, res, next)=>{
    let {id}= req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner.equals(res.locals.curruser._id)){
      req.flash("error" , " You do not have permission to do this.");
         return  res.redirect(`/listings/${id}`);
    }
      next();


 };
 


 module.exports.isAuthor= async(req, res, next)=>{
    let {id , reviewId}= req.params;
    let review = await Review.findById(reviewId);
    if(!review.author.equals(res.locals.curruser._id)){
      req.flash("error" , " You do not have permission to do this.");
         return  res.redirect(`/listings/${id}`);
    }
      next();


 };