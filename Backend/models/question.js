import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  
  questionTitle: {
    type: String,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  questionFile: { 
    public_id: { type: String }, 
    url: { type: String } 
  },
  answerText: {
    type: String,
    default: null 
  },
  status: {
    type: String,
    enum: ["Pending", "Answered"],
    default: "Pending"
  },
}, { timestamps: true });

export const Question = mongoose.model("Question", questionSchema);
