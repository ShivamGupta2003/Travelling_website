// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// const multer = require('multer');

// const cloudinary = require('cloudinary').v2;
// cloudinary.config({
//     cloud_name: 'dapepo4oo',   
//     api_key:'949697741434269',        
//     api_secret: 'T7hA27Hx9QO3vF7VDrWbNTEF2Ds',  
//   });

//   const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//       folder: 'shivam_DEV',
//       allowerdFormat:["png", "jpeg", "jpg"],  
//     }
//   });

//   // const upload = multer({ storage: storage });

// module.exports = { cloudinary, storage };


require('dotenv').config(); 
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   
    api_key: process.env.CLOUDINARY_API_KEY,        
    api_secret: process.env.CLOUDINARY_API_SECRET,  
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'shivam_DEV',
      allowedFormats: ["png", "jpeg", "jpg"],  
    }
});

module.exports = { cloudinary, storage };
