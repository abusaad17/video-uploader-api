import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import {SlotRoutes}  from "./routes/slot.route.js";
dotenv.config();
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_NAME });

SlotRoutes(app);

app.listen(process.env.PORT, () => {
    console.log(
      `Read the docs - http://localhost:${process.env.PORT}`
    );
  });
