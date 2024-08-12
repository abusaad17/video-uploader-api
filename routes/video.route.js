import { Video } from "../models/video.model.js";
import { Authorize } from "../middleware/auth.js";
import { User } from "../models/user.model.js";
import path, { join } from "path";
import __dirname from "path";
import fs from "fs";
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
  });
  // upload video
  app.post(
    "/api/video/upload",
    Authorize(),
    upload.fields([
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        if (!req.files || !req.files.video) {
          return res.status(400).send({ message: "No video file uploaded" });
        }
        const { title, description } = req.body;
        const videoFile = req.files.video[0].location;
        let thumbnailFile = ''
        if(req.files.thumbnail){
          thumbnailFile = req.files.thumbnail[0]?.location ?? '';
        }
        const newVideo = new Video({
          title,
          description,
          videoPath: videoFile,
          thumbnail: thumbnailFile,
          createdAt: Date.now(),
        });

        await newVideo.save();
        await User.findByIdAndUpdate(req.user._id, {
          $push: { videoId: newVideo._id },
        });
        // if (!req.file) {
        //   return res.status(400).send({ message: "No video file uploaded" });
        // }
        // const { title, description, thumbnail } = req.body;
        // const videoPath = req.file.path;

        // const newVideo = new Video({
        //   title,
        //   description,
        //   videoPath,
        //   thumbnail: thumbnail ?? '',
        //   createdAt: Date.now(),
        // });
        res.status(201).send({
          message: "Video uploaded successfully",
          video: newVideo,
        });
      } catch (error) {
        console.error("Error in video upload:", error);
        res
          .status(500)
          .send({ message: "Failed to upload video", error: error.message });
      }
    }
  );

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
        thumbnailUrl: video.thumbnail ?? 'No thumbnail', // This is now the S3 URL for the thumbnail
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
