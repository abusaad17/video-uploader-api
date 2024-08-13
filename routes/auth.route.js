import { AuthService } from "../services/auth.service.js";
import { User } from "../models/user.model.js";
import { Authorize } from "../middleware/auth.js";
import multerS3 from "multer-s3";
import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";


export const AuthRoutes = (app) => {

  app.post("/api/accounts/login", async (req, res) => {
    try {
      const { firstname, password } = req.body;
      // validation
      if (!firstname) {
        throw { code: 400, message: "Firstname is required" };
      }
      if (!password) {
        throw { code: 400, message: "Password is required" };
      }

      const accessToken = await AuthService.generateAccessToken(
        firstname,
        password
      );

      // internal validation
      if (!accessToken) {
        throw { code: 500, message: "Failed to generate access token" };
      }
      const user = await User.findOne({ email: accessToken.email });
      if (!user) {
        throw { code: 404, message: "User not found" };
      }

      if (user && accessToken) {
        res.status(200).send({
          token: accessToken.accessToken,
          userId: accessToken.userId,
        });
      } else {
        res
          .status(404)
          .json({ error: "User not found or access token is invalid" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/accounts/register", async (req, res) => {
    try {

      await AuthService.createUser(req.body);

      res
        .status(200)
        .send({ code: 200, message: "User registered successfully!" });

    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.get("/api/accounts/userdata", Authorize(), async (req, res) => {
    try {

      const response = await getUserData(req.user.email);
      res.status(200).send(response);

    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  // Configure AWS S3
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // Configure multer for S3 storage
  const upload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.S3_BUCKET_NAME,
      key: function (req, file, cb) {
        cb(null, Date.now().toString() + "-" + file.originalname);
      },
    }),
    limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Not an image! Please upload an image."), false);
      }
    },
  });

  app.post(
    "/api/accounts/biothumbnail",
    Authorize(),
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    async (req, res) => {
      try {

        await AuthService.addBioThumbnail(req.body.bio, req.files, req.user.email)
        res.status(200).send({
          message: "Thumbnail/bio added successfully",
        });
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );
};
