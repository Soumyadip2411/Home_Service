import UserModel from "../models/user.model.js";
import ProviderRequestModel from "../models/providerRequest.model.js";
import sendEmail from "../config/sendEmail.js";

// Middleware to check if user is admin
const isAdmin = async (userId) => {
  const user = await UserModel.findById(userId);
  return user && user.email === "soumyadip2411@gmail.com";
};

// Get all provider requests
export async function getProviderRequests(request, response) {
  try {
    const userId = request.userId;
    
    // Check if user is admin
    if (!(await isAdmin(userId))) {
      return response.status(403).json({
        message: "Access denied. Admin only.",
        error: true,
        success: false,
      });
    }

    const requests = await ProviderRequestModel.find()
      .populate('userId', 'name email avatar mobile')
      .sort({ createdAt: -1 });

    return response.json({
      message: "Provider requests fetched successfully",
      data: requests,
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// Approve provider request
export async function approveProviderRequest(request, response) {
  try {
    const userId = request.userId;
    const { requestId } = request.params;
    const { adminNotes } = request.body;
    
    // Check if user is admin
    if (!(await isAdmin(userId))) {
      return response.status(403).json({
        message: "Access denied. Admin only.",
        error: true,
        success: false,
      });
    }

    const providerRequest = await ProviderRequestModel.findById(requestId);
    if (!providerRequest) {
      return response.status(404).json({
        message: "Provider request not found",
        error: true,
        success: false,
      });
    }

    if (providerRequest.status !== "pending") {
      return response.status(400).json({
        message: "Request has already been processed",
        error: true,
        success: false,
      });
    }

    // Update user role to PROVIDER
    await UserModel.findByIdAndUpdate(providerRequest.userId, {
      role: "PROVIDER",
    });

    // Update request status
    await ProviderRequestModel.findByIdAndUpdate(requestId, {
      status: "approved",
      adminNotes: adminNotes || "",
      processedBy: userId,
      processedAt: new Date(),
    });

    // Send email notification to user
    await sendEmail({
      sendTo: providerRequest.userEmail,
      subject: "Provider Request Approved - HomeService",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">🎉 Congratulations!</h2>
          <p>Dear ${providerRequest.userName},</p>
          <p>Your request to become a service provider has been <strong>approved</strong>!</p>
          <p>You can now:</p>
          <ul>
            <li>Create and manage your services</li>
            <li>Receive booking requests from customers</li>
            <li>Earn money by providing your services</li>
          </ul>
          <p>Log in to your account to start creating your services.</p>
          <p>Best regards,<br>HomeService Team</p>
        </div>
      `,
    });

    return response.json({
      message: "Provider request approved successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// Reject provider request
export async function rejectProviderRequest(request, response) {
  try {
    const userId = request.userId;
    const { requestId } = request.params;
    const { adminNotes } = request.body;
    
    // Check if user is admin
    if (!(await isAdmin(userId))) {
      return response.status(403).json({
        message: "Access denied. Admin only.",
        error: true,
        success: false,
      });
    }

    const providerRequest = await ProviderRequestModel.findById(requestId);
    if (!providerRequest) {
      return response.status(404).json({
        message: "Provider request not found",
        error: true,
        success: false,
      });
    }

    if (providerRequest.status !== "pending") {
      return response.status(400).json({
        message: "Request has already been processed",
        error: true,
        success: false,
      });
    }

    // Update request status
    await ProviderRequestModel.findByIdAndUpdate(requestId, {
      status: "rejected",
      adminNotes: adminNotes || "",
      processedBy: userId,
      processedAt: new Date(),
    });

    // Send email notification to user
    await sendEmail({
      sendTo: providerRequest.userEmail,
      subject: "Provider Request Update - HomeService",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Request Update</h2>
          <p>Dear ${providerRequest.userName},</p>
          <p>We regret to inform you that your request to become a service provider has been <strong>rejected</strong>.</p>
          <p>You can:</p>
          <ul>
            <li>Continue using our platform as a customer</li>
            <li>Submit a new request in the future</li>
            <li>Contact support for more information</li>
          </ul>
          <p>Thank you for your interest in HomeService.</p>
          <p>Best regards,<br>HomeService Team</p>
        </div>
      `,
    });

    return response.json({
      message: "Provider request rejected successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// Get admin dashboard stats
export async function getAdminStats(request, response) {
  try {
    const userId = request.userId;
    
    // Check if user is admin
    if (!(await isAdmin(userId))) {
      return response.status(403).json({
        message: "Access denied. Admin only.",
        error: true,
        success: false,
      });
    }

    const totalUsers = await UserModel.countDocuments({ role: "USER" });
    const totalProviders = await UserModel.countDocuments({ role: "PROVIDER" });
    const pendingRequests = await ProviderRequestModel.countDocuments({ status: "pending" });
    const approvedRequests = await ProviderRequestModel.countDocuments({ status: "approved" });
    const rejectedRequests = await ProviderRequestModel.countDocuments({ status: "rejected" });

    return response.json({
      message: "Admin stats fetched successfully",
      data: {
        totalUsers,
        totalProviders,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
      },
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
} 