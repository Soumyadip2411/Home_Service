import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: String,
  image: { 
    type: String, 
    required: true 
  },
}, { timestamps: true });

const CategoryModel = mongoose.model("Category", categorySchema);

export default CategoryModel;