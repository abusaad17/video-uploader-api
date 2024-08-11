import mongoose from "mongoose";

// Video Schema with a reference to the GridFS video file
export const Video = mongoose.model(
  "Video",
  new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoPath: { type: String, required: true },
    thumbnail: { type: String },
    createdAt: { type: Date },
  }),
  "videos"
);
