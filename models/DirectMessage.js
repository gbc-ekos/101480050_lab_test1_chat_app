import mongoose from "mongoose";

const DirectMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  user: { type: String, rqeuired: true },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  target: { type: String, required: true },
  message: { type: String, required: true },
  dateSent: { type: Date, default: Date.now, immutable: true },
});

export default mongoose.model("DirectMessage", DirectMessageSchema);
