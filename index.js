import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: __dirname + "/.env",
});

console.log(process.env);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

const app = express();
app.use(express.json());

// setup libraries endpoints
app.use(
  "/libs/bootstrap",
  express.static(__dirname + "/node_modules/bootstrap/dist"),
);
app.use(
  "/libs/jquery",
  express.static(__dirname + "/node_modules/jquery/dist"),
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "home.html"));
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
