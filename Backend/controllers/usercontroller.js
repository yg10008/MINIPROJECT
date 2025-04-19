import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import dotenv from "dotenv"
import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/dataUri.js";

dotenv.config({})
const JWT_SECRET = process.env.JWT_SECRET;



export const registerStudent = async (req, res) => {
  try {

    const { fullname, email, password, department, semester, phoneNumber } = req.body;


    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new User({
      userId: Date.now().toString(),
      fullname,
      email,
      password: hashedPassword,
      semester,
      role: "Student",
      department,
      phoneNumber
    });

    await newStudent.save();
    res.status(201).json({ message: "Student registered successfully!", success: true });
  } catch (error) {
    res.status(500).json({ message: "Error registering student", error });
  }
};


export const addFaculty = async (req, res) => {
  try {
    const { fullname, email, password, department, phoneNumber, subject } = req.body; 

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only admins can add faculty!" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    if (!subject || !Array.isArray(subject) || subject.length === 0) {
      return res.status(400).json({ message: "Faculty must have at least one subject" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newFaculty = new User({
      userId: Date.now().toString(),
      fullname,
      email,
      password: hashedPassword,
      role: "Faculty", 
      department,
      phoneNumber,
      subject, 
    });

    await newFaculty.save();
    res.status(201).json({ message: "Faculty added successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error adding faculty", error });
  }
};



export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.status(200).json({ message: "Login successful!", user });

  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production", 
      path: "/", 
    });

    res.status(200).json({ message: "Logout successful!", success: true });
  } catch (error) {
    res.status(500).json({ message: "Error logging out", error: error.message });
  }
};




export const updateProfile = async (req, res) => {
  try {
    const { fullname, phoneNumber, semester, department } = req.body;



    const userId = req.params.id;
    const file = req.file; 

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (file) {
      const fileUri = getDataUri(file);

      const uploadResult = await cloudinary.uploader.upload(fileUri.content, {
        folder: "profile_pictures",
      });

      if (user.profile.profilePicture?.public_id) {
        await cloudinary.uploader.destroy(user.profile.profilePicture.public_id);
      }

      user.profile.profilePicture = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    if (fullname) user.fullname = fullname;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (department) user.department = department;
    if (semester !== undefined && user.role === "Student") {
      user.semester = semester;
    }

    await user.save();

    const updatedUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      profile: user.profile,
      phoneNumber: user.phoneNumber,
      department: user.department,
      role: user.role,
    };

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getFacultyBySubject = async (req, res) => {
  try {
    const { subject } = req.query; 

    if (!subject) {
      return res.status(400).json({ message: "Subject is required" });
    }

    const faculty = await User.find({
      role: "Faculty",
      subject: { $in: [subject] } 
    });

    if (faculty.length === 0) {
      return res.status(404).json({ message: "No faculty found for this subject" });
    }

    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: "Error fetching faculty", error });
  }
};
export const getAllFaculty = async (req, res) => {
  try {
    const faculty = await User.find({ role: "Faculty" });

    if (faculty.length === 0) {
      return res.status(404).json({ message: "No faculty found" });
    }

    res.status(200).json(faculty);
  } catch (error) {
    console.error("Error fetching faculty:", error);
    res.status(500).json({ message: "Error fetching faculty", error });
  }
};



export const getAllSub = async (req, res) => {
  try {

    const allSub = [
      "Statistical and Numerical Techniques",
      "Computer Architecture and Microprocessor Interfacing",
      "Computer Networks",
      "Design and Analysis of Algorithms",
      "Full Stack Web Development",
      "Human Values and Professional Ethics",
      "Mobile Application Development",
      "Cryptography & Network Security",
      "Machine Learning",
      "Contributory Personality Development"
    ]
    res.json({ allSub, success: true });

  } catch (error) {
    console.log(error);

  }
}

export const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only admins can delete faculty!" });
    }

    const faculty = await User.findById(id);
    if (!faculty) {
      return res.status(404).json({ message: "Faculty member not found" });
    }

    if (faculty.role !== "Faculty") {
      return res.status(400).json({ message: "Can only delete faculty members" });
    }

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "Faculty deleted successfully" });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({ message: "Error deleting faculty", error: error.message });
  }
};
