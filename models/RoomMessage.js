import mongoose from "mongoose";

const RoomMessageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  room: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  user: { type: String, rqeuired: true },
  message: { type: String, required: true },
  dateSent: { type: Date, default: Date.now, immutable: true },
});

export default mongoose.model("RoomMessage", RoomMessageSchema);
