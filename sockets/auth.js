import { sign } from "../auth/jwt.js";
import User from "../models/User.js";

export function registerAuthChannel(io) {
  const authChannel = io.of("/auth");

  authChannel.on("connection", (socket) => {
    // Register handler
    socket.on(
      "register",
      async ({ username, password, firstname, lastname }, callback) => {
        const newUser = new User({
          username,
          password,
          firstname,
          lastname,
        });
        try {
          await newUser.save();
          const token = sign(newUser);
          callback({
            success: true,
            token,
            ...newUser.toJSON(),
          });
        } catch (error) {
          callback({
            success: false,
            message: error.message,
          });
        }
      },
    );

    // Login handler
    socket.on("login", async ({ username, password }, callback) => {
      const user = await User.findOne({ username });
      if (!user || !(await user.checkPassword(password))) {
        return callback({ success: false, message: "Invalid credentials" });
      }

      const token = sign(user);
      callback({
        success: true,
        token,
        ...(user.toJSON()),
      });
    });
  });
}
