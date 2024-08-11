//config.js
// const mongoose = require("mongoose");
import mongoose from 'mongoose';
export const connectDB = () => {
  try {
    mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

