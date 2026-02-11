import express from "express";
import dotenv from "dotenv";
import http from 'http';
import { Server } from 'socket.io';
import { registerAuthChannel } from './sockets/auth.js';

import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: __dirname + "/.env",
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

const app = express();
const server = http.createServer(app);
const io = new Server(server);
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

// setup static
app.use(express.static(__dirname + '/views'));
app.use('/scripts', express.static(__dirname + '/scripts'));

// register socket channels
registerAuthChannel(io);

server.listen(3000, () => console.log(`Server running on http://localhost:3000`))
