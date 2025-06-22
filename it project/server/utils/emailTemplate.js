export const forgotPasswordTemplate = ({ name, otp }) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px; background-color: #f9f9f9;">
    <h2 style="color: #333;">Password Reset Request</h2>
    
    <p>Dear <strong>${name}</strong>,</p>
    
    <p>We received a request to reset your password for your <strong>HomeService</strong> account. Please use the one-time password (OTP) below to proceed:</p>
    
    <div style="background-color: #ffe58a; padding: 20px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 6px; color: #333;">
      ${otp}
    </div>
    
    <p style="margin-top: 20px;">This OTP is valid for <strong>1 hour</strong> only. Please do not share this code with anyone.</p>
    
    <p>If you did not request a password reset, you can safely ignore this email.</p>
    
    <br />
    
    <p>Best regards,</p>
    <p style="font-weight: bold;">HomeService Team</p>
    <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
  </div>
  `;
};

export const verifyEmailTemplate = ({ name, url }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #333;">Hello ${name},</h2>
      <p style="font-size: 16px; color: #555;">Thank you for registering with <strong>HomeService</strong>. To complete your registration, please verify your email address by clicking the button below.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="text-decoration: none; font-size: 16px; background-color: #ff6600; color: #fff; padding: 12px 24px; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p style="font-size: 14px; color: #777;">If you did not create an account with HomeService, you can safely ignore this email.</p>
      <p style="font-size: 14px; color: #999;">&mdash; The HomeService Team</p>
    </div>
  `;
};

export const updateBookingStatusTemplate = ({
  userName,
  bookingId,
  serviceName,
  status,
  providerName,
  providerNumber,
}) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px; background-color: #f9f9f9;">
    <h2 style="color: #333;">Booking Status Update</h2>
    
    <p>Dear <strong>${userName}</strong>,</p>
    
    <p>The status of your booking <strong>#${bookingId}</strong> for <strong>${serviceName}</strong> has been updated to:</p>
    
    <div style="background-color: ${getStatusColor(
      status
    )}; padding: 15px; font-size: 20px; font-weight: bold; text-align: center; border-radius: 6px; color: white; margin: 20px 0;">
      ${formatStatusText(status)}
    </div>
    
    ${
      status === "confirmed"
        ? `
      <p>Your service provider has confirmed the booking:</p>
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <p><strong>Provider:</strong> ${providerName}</p>
        <p><strong>Contact:</strong> <a href="tel:${providerNumber}">${providerNumber}</a></p>
        <p style="font-size: 13px; color: #666;">You may now contact the provider directly for any queries</p>
      </div>
    `
        : ""
    }
    
    ${
      status === "completed"
        ? `
      <p>Your service has been successfully completed. We hope you had a great experience!</p>
      <p style="font-size: 13px; color: #666;">Please consider leaving a review for your provider.</p>
    `
        : ""
    }
    
    ${
      status === "cancelled"
        ? `
      <p>Your booking has been cancelled. If this was unexpected, please contact our support team.</p>
    `
        : ""
    }
    
    <br />
    
    <p>You can view your booking details anytime in your account dashboard.</p>
    
    <br />
    
    <p>Best regards,</p>
    <p style="font-weight: bold;">HomeService Team</p>
    <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
  </div>
  `;
};

const getStatusColor = (status) => {
  const colors = {
    confirmed: "#4CAF50",
    completed: "#2196F3",
    cancelled: "#F44336",
    pending: "#FFC107",
  };
  return colors[status] || "#9E9E9E";
};

const formatStatusText = (status) => {
  const textMap = {
    confirmed: "CONFIRMED",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
    pending: "PENDING",
  };
  return textMap[status] || status.toUpperCase();
};


export const bookingNotificationTemplate = ({ providerName, customerName, serviceTitle, scheduledAt, location, notes }) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px; background-color: #f9f9f9;">
    <h2 style="color: #333;">New Booking Request</h2>
    
    <p>Dear <strong>${providerName}</strong>,</p>
    
    <p>You have received a new service booking request via <strong>HomeService</strong>.</p>

    <div style="margin: 20px 0; padding: 20px; background-color: #e6f7ff; border-radius: 6px;">
      <p><strong>Customer Name:</strong> ${customerName}</p>
      <p><strong>Service:</strong> ${serviceTitle}</p>
      <p><strong>Scheduled Date:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
      <p><strong>Location:</strong> ${location}</p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
    </div>

    <p>Please review the booking details and take appropriate action through your dashboard.</p>

    <br />

    <p>Best regards,</p>
    <p style="font-weight: bold;">HomeService Team</p>
    <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
  </div>
  `;
};
