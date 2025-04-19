import { User } from "../models/User.js";

export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "Admin") {
      return res.status(403).json({ message: "Access Denied: Admins Only" });
    }

    next(); 
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
