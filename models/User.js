import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  dateUpdated: {
    type: Date,
    default: Date.now,
  },
});

// hashing password on save
UserSchema.pre("save", async function () {
  this.dateUpdated = new Date();
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// Auto update da
UserSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function () {
  this.set({ dateUpdated: new Date() });
});

// Utility to easily check password
UserSchema.methods.checkPassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model("User", UserSchema);
