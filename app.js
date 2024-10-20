if(process.env.NODE_ENV != "production"){
  require('dotenv').config();
}

const express = require("express");
const mongoose = require("mongoose");

const app = express();

 const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utlis/wrapAsync");

const ExpressError = require("./utlis/ExpressError");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const {listingSchema}= require("./schema.js");
const {reviewSchema}= require("./schema.js");
 const Listing = require("./models/listing");
 const Review = require("./models/review");
 const passport =require("passport");
const localStrategy = require("passport-local");
const User  = require("./models/user.js");
const {isLoggedIn, savedRedirectUrl, isOwner, isAuthor}= require("./middleware.js");

// dbcloud

const multer = require('multer');
const {storage}= require("./cloudconfig.js");
const upload = multer({storage});


// Connect to MongoDB

//  const MONGO_URL ="mongodb://localhost:27017/mydatabase";

const dburl =process.env.ATLASDB_URL;

    main()
    .then(()=>{
        console.log("connected to db ");

    })
    .catch((err)=>{

        console.log(err);

    });

    // async function main(){
    //     await mongoose.connect(MONGO_URL);

    // }
    
    async function main(){
        await mongoose.connect(dburl);

    }

     app.set("view engine ", "ejs ");
     app.set("views ", path.join(__dirname, "views"));

      app.use(express.urlencoded({extended:true }));
      app.use(methodOverride("_method"));

     app.engine('ejs', ejsMate );
     app.use(express.static(path.join( __dirname, "/public")));

  
          
     const store =MongoStore.create({
      mongoUrl : dburl,
      crypto:{
       secret:"myname",
      },
      touchAfter:24*60*60,

   });
    store.on("error", ()=>{
      console.log("error occured in db" , err);
    });
         const sessionOptions ={
          store,
          secret:"myname",
          resave:false ,
          saveUninitialized:true,
          cookie:{
            expires:Date.now()+ 1000*60*60*24*3,
            maxAge:1000*60*60*24*3,
            httpOnly:true
          }
         };
     
         // Basic route
// app.get("/", (req, res) => {
//   res.send("Hello Shivam");
// });


         app.use(session(sessionOptions));
         app.use(flash());
         app.use(passport.initialize());
         app.use(passport.session());
         passport.use(new localStrategy(User.authenticate()));
         passport.serializeUser(User.serializeUser());
         passport.deserializeUser(User.deserializeUser());

           app.use((req, res , next)=>{
            res.locals.success= req.flash("success");
            res.locals.error= req.flash("error");
            res.locals.curruser = req.user;
            next();
           });

              

//   validate middleware 
   const validateListing = ( req , res , next)=>{

    let {error }= listingSchema.validate(req.body);
    if(error){  

        let errMsg = error.details.map((el)=>el.message).join(",");
      throw new ExpressError(400 , errMsg);
    }else{
      next();
    }
   };

  //   review validate middleware 

  const validateReview  = ( req , res , next)=>{

    let {error }= reviewSchema.validate(req.body);
    if(error){  

        let errMsg = error.details.map((el)=>el.message).join(",");
      throw new ExpressError(400 , errMsg);
    }else{
      next();
    }
   };

   
// test listing 
app.get("/testListing",wrapAsync(async (req, res)=>{
   let sample = new Listing({

    title:" I love myself",
    description:"By the beach ",
    price :1200,
     location :"Cal, goa ",
     country: "India ",
   });
   await sample.save();
   console.log("sample is saved ");
     res.send("successful");
     

}));

//  app.get("/listings", wrapAsync(async(req, res )=>{

//   const allListings = await Listing.find({});
//   res.render("listings/index.ejs", {allListings});

//  }));

app.get("/listings", wrapAsync(async (req, res) => {
  const { category } = req.query;
  
  let filter = {};
  if (category) {
      filter.category = category;  // Apply filter if category is selected
  }

  const allListings = await Listing.find(filter);
  res.render("listings/index.ejs", { allListings, category });
}));

  // new route 

app.get("/listings/new",isLoggedIn, (req, res )=>{
  res.render("listings/new.ejs");
  
});


//   show route 
app.get("/listings/:id", wrapAsync(async(req , res )=>{
  let {id}= req.params;
   const listing = await Listing.findById(id).populate( {path:"reviews" , 
    populate:{
      path:"author",
    }
   }).populate("owner");
   if(!listing){
    req.flash("error", "Listing you requested for does not exit ");
    res.redirect("/listings");
   }
      res.render("listings/show.ejs", {listing})

}) );

// create route
app.post("/listings",isLoggedIn, upload.single('listing[image]') , validateListing ,wrapAsync(async(req, res , next )=>{  
      let result =  listingSchema.validate(req.body);
       let url = req.file.path;
       let filename = req.file.filename;
         console.log( url ," n" ,filename);
        const newlisting = new Listing(req.body.listing);
        newlisting.owner = req.user._id;
        newlisting.image = {url , filename};
        console.log(newlisting);
        await newlisting.save();
        req.flash("success", "new listing created");
           res.redirect("/listings");


}));


// app.post("/listings", upload.single('listing[image]') ,(req, res)=>{
 
//   res.send(req.file);
// });

//  Edit Route 
app.get("/listings/:id/edit", isLoggedIn,isOwner,wrapAsync(async( req, res)=>{
  let {id}= req.params;
  const listing = await Listing.findById(id);
  if(!listing){
    req.flash("error", "Listing you requested for does not exit ");
    res.redirect("/listings");
   }
   let originalimageurl =listing.image.url ;
   originalimageurl=originalimageurl.replace("/upload", "/upload/h_300,w_250");
   res.render("listings/edit.ejs",{listing, originalimageurl});

}));

// Update Route 
app.put("/listings/:id",isLoggedIn, isOwner,upload.single('listing[image]') , validateListing, wrapAsync(async(req , res )=>{

  let {id}= req.params;
 let listing =  await Listing.findByIdAndUpdate(id , {...req.body.listing});
  if( typeof req.file !== "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image ={url , filename};
    await listing.save();
  }
  req.flash("success", "Listing Updated successfully !");
  res.redirect(`/listings/${id}`);
}));

  //   delete Route 

  app.delete("/listings/:id",isLoggedIn, isOwner,wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    console.log(deleteListing);
    req.flash("success", "Listing deleted successfully !");
    res.redirect("/listings");
})); 

// reviews 
// post 

 app.post("/listings/:id/reviews",isLoggedIn, validateReview,wrapAsync( async(req, res)=>{


  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
  newReview.author = req.user._id;
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  req.flash("success", "new review  created");
    res.redirect(`/listings/${listing._id}`);

 }));

//    delete route for the reviews 
  app.delete(
    "/listings/:id/reviews/:reviewId",
    isLoggedIn,
    isAuthor,
    wrapAsync(async(req, res)=>{
      let {id , reviewId}= req.params;
      await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
      await Review.findByIdAndDelete(reviewId);
      req.flash("success", "Review Deleted Succesfully");
      res.redirect(`/listings/${id}`);
    })
  );




  //   user form 

  // signup   route 

  app.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
  });

  app.post("/signup", wrapAsync(async(req, res)=>{

    try{
      let {username , email, password}=req.body;
      const newUser = new User({email , username});
    const registeredUser = await User.register(newUser, password);
     req.login(registeredUser,(err)=>{
      if(err){
        return next(err);
      }
      req.flash("success", "Welcome to wanderlust");
      res.redirect("/listings");
     })
    }catch(e){
      req.flash("error", e.message);
      res.redirect("/signup");
    }

  }));

  // login route 
   
  app.get("/login",(req, res)=>{
     res.render("users/login.ejs");
  });

  app.post(
    "/login",
    savedRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true
    }),
     async(req,res)=>{
      req.flash("success", "Welcome To WanderLust You are LoggedIn");
    let url = res.locals.redirectUrl || "/listings"
      res.redirect(url);
     }
  );

  //  logout 
  app.get("/logout", (req, res , next )=>{
    req.logout((err)=>{
      if(err){
       return  next(err);
      }
      req.flash("success", "You are LoggedOut Successfully !!");
      res.redirect("/listings");
    })
  });


// >>>>>>>>>>>>>>>>>>>>>>>>>
  app.all("*" , (req ,res , next)=>{
    next(new ExpressError (404 , "Page Not Found "));
  });

  //  middleware for the error  handling 
  app.use((err,req,res,next)=>{
    let{statusCode=500,message= "somthing went wrong"} =err;
    res.status(statusCode).render("listings/error.ejs",{message})
    // res.status(statusCode).send(message);
  });
  

// Listen on port 3000
app.listen(3000, () => {
  console.log("App is listening on port 3000");
});
