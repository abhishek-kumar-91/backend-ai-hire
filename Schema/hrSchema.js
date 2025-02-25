import mongoose from "mongoose";

const hrSchema = new mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  position: String,
  company: String,
  location: String,
});

export default mongoose.model("HR", hrSchema);