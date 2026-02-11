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
  firstname: {
    type: String,
    minLength: 2,
    maxLength: 50,
  },
  lastName: {
    type: String,
    minLength: 2,
    maxLength: 50,
  },
  createon: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updateOn: {
    type: Date,
    default: Date.now,
  },
});

// hashing password on save
UserSchema.pre("save", async function () {
  this.updateOn = new Date();
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// Auto update da
UserSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function () {
  this.set({ updateOn: new Date() });
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
