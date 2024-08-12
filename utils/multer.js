import multer from "multer";
import path from "path";
import multerS3 from'multer-s3';
import { S3Client } from'@aws-sdk/client-s3';
// import { Upload } from '@aws-sdk/lib-storage';
// Set up multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/"); // Ensure the uploads folder exists
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(
//       null,
//       file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
//     );
//   },
// });

// export const upload = multer({
//   storage: storage,
//   fileFilter: function (req, file, cb) {
//     const filetypes = /mp4/;
//     const mimetype = filetypes.test(file.mimetype);
//     const extname = filetypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );

//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb("Error: Only MP4 files are allowed!");
//     }
//   },
//   limits: { fileSize: 1000000000 } // Limit file size to 1GB
// });

// Configure AWS S3
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// // Configure multer for S3 storage
// export const upload = multer({
//   storage: multerS3({
//     s3: s3Client,
//     bucket: process.env.S3_BUCKET_NAME,
//     key: function (req, file, cb) {
//       cb(null, Date.now().toString() + '-' + file.originalname);
//     }
//   })
// });