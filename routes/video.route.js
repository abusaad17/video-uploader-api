import { Video } from "../models/video.model.js";
import { Authorize } from "../middleware/auth.js";
import { upload } from "../utils/multer.js";
import { User } from "../models/user.model.js";
import path, { join } from "path";
import __dirname from "path";
import fs from "fs";

export const VideoRoutes = (app) => {
  // upload video
  app.post(
    "/api/video/upload",
    Authorize(),
    upload.single("video"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).send({ message: "No video file uploaded" });
        }
        const { title, description } = req.body;
        const videoPath = req.file.path;

        const newVideo = new Video({
          title,
          description,
          videoPath,
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
        .select("_id firstname lastname videoId")
        .limit(5); // Limit to 5 users for efficiency

      const usersWithVideos = await Promise.all(
        users.map(async (user) => {
          // Find the 5 most recent videos for this user
          const videos = await Video.find({ _id: { $in: user.videoId } })
            .sort({ createdAt: -1 })
            .limit(5);

          const videoArray = await Promise.all(
            videos.map(async (video) => {
              if (!video.videoPath || typeof video.videoPath !== "string") {
                console.error("Invalid videoPath:", video.videoPath);
                return null;
              }

              const filename = path.basename(video.videoPath);
              const currentDir = process.cwd();
              const filePath = path.join(currentDir, "uploads", filename);

              try {
                const fileData = fs.readFileSync(filePath);
                return fileData.toString("base64");
              } catch (err) {
                console.error(`Error processing file ${filePath}:`, err);
                return null;
              }
            })
          );
          console.log(videoArray.length);
          return {
            userId: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            videoArray: videoArray.filter((v) => v !== null),
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
      // Convert each video to Base64
      const videoData = await Promise.all(
        videos.map(async (video) => {
          // Extract filename from videoPath
          const filename = path.basename(video.videoPath);
          const currentDir = process.cwd();
          const filePath = path.join(currentDir, "uploads", filename);

          try {
            // Read file and convert to Base64
            const fileData = fs.readFileSync(filePath);
            const base64Data = fileData.toString("base64");

            return {
              _id: video._id,
              title: video.title,
              description: video.description,
              videoBase64: base64Data,
              createdAt: video.createdAt,
            };
          } catch (err) {
            console.error(`Error reading file ${filePath}:`, err);
            return null; // Handle error and continue processing other videos
          }
        })
      );

      // Remove any null entries due to errors
      const filteredVideoData = videoData.filter((v) => v !== null);

      res.status(200).send(filteredVideoData);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res
        .status(500)
        .send({ message: "Failed to fetch videos", error: error.message });
    }
  });
};
