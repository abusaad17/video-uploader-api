import { Video } from "../models/video.model.js";
import { Authorize } from "../middleware/auth.js";
import { User } from "../models/user.model.js";
import __dirname from "path";
import multerS3 from "multer-s3";
import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";

export const VideoRoutes = (app) => {
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
    fileFilter: function (req, file, cb) {
      if (file.fieldname === "video") {
        if (file.mimetype !== "video/mp4") {
          return cb(new Error("Only .mp4 format is allowed for video"), false);
        }
      } else if (file.fieldname === "thumbnail") {
        if (!file.mimetype.startsWith("image/")) {
          return cb(
            new Error("Only image files are allowed for thumbnail"),
            false
          );
        }
      }
      cb(null, true);
    },
    limits: { fileSize: 6 * 1024 * 1024 }, // 7MB total limit
  }).fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]);

  // upload video
  app.post("/api/video/upload", Authorize(), async (req, res) => {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .send({ message: "File size should not exceed 6MB" });
        }
        return res.status(400).send({ message: err.message });
      } else if (err) {
        return res.status(400).send({ message: err.message });
      }

      try {
        if (!req.files || !req.files.video) {
          return res.status(400).send({ message: "No video file uploaded" });
        }

        const { title, description } = req.body;
        if (!title) {
          throw { code: 400, message: "Title is required" };
        }
        if (title.length > 30) {
          throw {
            code: 400,
            message: "Title should not be more than 30 characters.",
          };
        }
        if (description.length > 120) {
          throw {
            code: 400,
            message: "Description should not be more than 120 characters.",
          };
        }

        const videoURl = req.files.video[0].location;
        let thumbnailFile = "";
        if (req.files.thumbnail) {
          thumbnailFile = req.files.thumbnail[0]?.location ?? "";
        }

        const newVideo = new Video({
          title,
          description,
          videoPath: videoURl,
          thumbnail: thumbnailFile,
          createdAt: Date.now(),
        });

        await newVideo.save();
        await User.findByIdAndUpdate(req.user._id, {
          $push: { videoId: newVideo._id },
        });

        res.status(201).send({
          message: "Video uploaded successfully",
          video: newVideo,
        });
      } catch (error) {
        console.error("Error in video upload:", error);
        res.status(error.code || 500).send({ message: error.message });
      }
    });
  });

  app.get("/api/video/all", async (req, res) => {
    try {
      // Find all users who have uploaded videos
      const users = await User.find({ videoId: { $exists: true, $ne: [] } })
        .select("_id firstname lastname videoId thumbnail")
        .limit(5); // Limit to 5 users for efficiency

      const usersWithVideos = await Promise.all(
        users.map(async (user) => {
          // Find the 5 most recent videos for this user
          const videos = await Video.find({ _id: { $in: user.videoId } })
            .sort({ createdAt: -1 })
            .limit(5);

          const videoArray = videos.map((video) => ({
            videoUrl: video.videoPath, // This is now the S3 URL
            thumbnail: video.thumbnail, // This is now the S3 URL for the thumbnail
            title: video.title,
            description: video.description,
            createdAt: video.createdAt,
          }));

          return {
            userId: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            thumbnail: user.thumbnail,
            videoArray,
          };
        })
      );

      res.status(200).json(usersWithVideos);
    } catch (error) {
      console.error("Error fetching recent videos:", error);
      res.status(500).json({
        message: "Failed to fetch recent videos",
        error: error.message,
      });
    }
  });

  // Get Video by user ID
  app.get("/api/video/:userId", Authorize(), async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      // Fetch all videos for the user
      const videos = await Video.find({ _id: { $in: user.videoId } });

      const videoData = videos.map((video) => ({
        _id: video._id,
        title: video.title,
        thumbnailUrl: video.thumbnail ?? "No thumbnail", // This is now the S3 URL for the thumbnail
        description: video.description,
        videoUrl: video.videoPath, // This is now the S3 URL for the video
        createdAt: video.createdAt,
      }));

      res.status(200).send(videoData);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res
        .status(500)
        .send({ message: "Failed to fetch videos", error: error.message });
    }
  });
};
