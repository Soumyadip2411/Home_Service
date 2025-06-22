import CategoryModel from "../models/category.model.js";
import uploadImageClodinary from "../utils/uploadImageClodinary.js";

export async function createCategory(request, response) {
  try {
    const { name, description } = request.body;
    const image = request.file;

    if (!name || !image) {
      return response.status(400).json({
        message: "Name and image are required",
        error: true,
        success: false,
      });
    }

    const uploadedImage = await uploadImageClodinary(image);

    const category = new CategoryModel({
      name,
      description,
      image: uploadedImage.url,
    });

    const savedCategory = await category.save();

    return response.status(201).json({
      message: "Category created successfully",
      data: savedCategory,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getCategories(request, response) {
  try {
    const categories = await CategoryModel.find({});

    return response.json({
      message: "Categories fetched successfully",
      data: categories,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getCategory(request, response) {
  try {
    const { id } = request.params;
    const category = await CategoryModel.findById(id);

    if (!category) {
      return response.status(404).json({
        message: "Category not found",
        error: true,
        success: false,
      });
    }

    return response.json({
      message: "Category fetched successfully",
      data: category,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function updateCategory(request, response) {
  try {
    const { id } = request.params;
    const { name, description } = request.body;
    const image = request.file;

    const category = await CategoryModel.findById(id);
    if (!category) {
      return response.status(404).json({
        message: "Category not found",
        error: true,
        success: false,
      });
    }

    let imageUrl = category.image;
    if (image) {
      const uploadedImage = await uploadImageClodinary(image);
      imageUrl = uploadedImage.url;
    }

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id,
      {
        name: name || category.name,
        description: description || category.description,
        image: imageUrl,
      },
      { new: true }
    );

    return response.json({
      message: "Category updated successfully",
      data: updatedCategory,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function deleteCategory(request, response) {
  try {
    const { id } = request.params;
    
    const category = await CategoryModel.findByIdAndDelete(id);
    
    if (!category) {
      return response.status(404).json({
        message: "Category not found",
        error: true,
        success: false,
      });
    }

    return response.json({
      message: "Category deleted successfully",
      data: category,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}