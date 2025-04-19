import { User } from "../models/User.js";

export const facultyMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "Faculty") {
      return res.status(403).json({ message: "Access Denied: Faculty Only" });
    }

    next(); 
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
