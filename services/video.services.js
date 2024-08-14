import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

export const VideoService = {
  uploadVideo: async (title, description, files, userId) => {
    const videoURl = files.video[0].location;
    let thumbnailFile = "";
    if (files.thumbnail) {
      thumbnailFile = files.thumbnail[0]?.location ?? "";
    }
    const newVideo = new Video({
      title,
      description,
      videoPath: videoURl,
      thumbnail: thumbnailFile,
      createdAt: Date.now(),
    });

    await newVideo.save();
    await User.findByIdAndUpdate(userId, {
      $push: { videoId: newVideo._id },
    });
    return newVideo;
  },

  getAllVideos: async () => {
    try {
      const users = await User.find({ videoId: { $exists: true, $ne: [] } })
        .select("_id firstname lastname videoId thumbnail")

      const usersWithVideos = await Promise.all(
        users.map(async (user) => {
          const videos = await Video.find({ _id: { $in: user.videoId } })
            .sort({ createdAt: -1 })
            .limit(5);

          const videoArray = videos.map((video) => ({
            videoUrl: video.videoPath,
            thumbnail: video.thumbnail,
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
      return usersWithVideos;
    } catch (err) {
      console.error(err);
      throw { code: 500, message: "Failed to create user or send email" };
    }
  },
  getVideoByUserId: async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }

        const videos = await Video.find({ _id: { $in: user.videoId } });

        const videoData = videos.map((video) => ({
          _id: video._id,
          title: video.title,
          thumbnailUrl: video.thumbnail ?? "No thumbnail",
          description: video.description,
          videoUrl: video.videoPath,
          createdAt: video.createdAt,
        }));

      return videoData;
    } catch (err) {
      console.error(err);
      throw { code: 500, message: "Failed to get user data." };
    }
  },
};
