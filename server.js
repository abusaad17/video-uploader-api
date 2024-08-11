import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import logger from "morgan";
import { AuthRoutes } from "./routes/auth.route.js";
import { connectDB } from "./database/config.js";
import { VideoRoutes } from "./routes/video.route.js";

dotenv.config();
const app = express();

// Connect to database
connectDB();

// Middleware for parsing request body and logging requests
app.use(bodyParser.json());
app.use(logger("dev"));
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Routes for API endpoints
VideoRoutes(app);
AuthRoutes(app);

// Server listening on port 3000 for incoming requests
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
