export const baseURL = import.meta.env.VITE_API_URL ;

const SummaryApi = {
  register: {
    url: "/api/user/register",
    method: "post",
  },
  login: {
    url: "/api/user/login",
    method: "post",
  },
  forgot_password: {
    url: "/api/user/forgot-password",
    method: "put",
  },
  forgot_password_otp_verification: {
    url: "api/user/verify-forgot-password-otp",
    method: "put",
  },
  resetPassword: {
    url: "/api/user/reset-password",
    method: "put",
  },
  refreshToken: {
    url: "api/user/refresh-token",
    method: "post",
  },
  logout: {
    url: "/api/user/logout",
    method: "get",
  },
  uploadAvatar: {
    url: "/api/user/upload-avatar",
    method: "put",
  },
  updateUserDetails: {
    url: "/api/user/update-user",
    method: "put",
  },
  userDetails: {
    url: "/api/user/get-user-details",
    method: "get",
  },
  getBookings: {
    url: "/api/bookings/get-bookings",
    method: "get",
  },
  updateBookingStatus: {
    url: "/api/bookings/update-booking-status",
    method: "post",
  },
  getMyBookings: {
    url: "/api/bookings/my-bookings",
    method: "get",
  },
  
  createBooking: {
    url: "/api/bookings/create-booking",
    method: "post",
  },
  getCustomerNameByBookingId: {
    url: "/api/bookings/customer-name",
    method: "get",
  },
  getProviderNameByBookingId: {
    url: "/api/bookings/provider-name",
    method: "get",
  },
  getAllCategories: {
    url: "/api/category/all",
    method: "get",
  },
  createCategory: {
    url: "/api/category/create",
    method: "post",
  },
  getCategory: {
    url: "/api/category",
    method: "get",
  },
  updateCategory: {
    url: "/api/category",
    method: "put",
  },
  deleteCategory: {
    url: "/api/category",
    method: "delete",
  },
  addService : {
    url : '/api/service/add-service',
    method : "post"
  },
  getServices : {
    url : '/api/service/all-services',
    method : "get"
  },
  getProviderServices : {
    url : '/api/service/',
    method : 'get'
  },
  uploadImage: {
    url: '/api/upload/upload',  // Add this endpoint
    method: 'post'
  },
  createReview: {
    url: "/api/review/create/:serviceId", // Updated to match the server route
    method: "post"
  },
  getReviews: {
    url: "/api/review/service",
    method: "get"
  },
};

export default SummaryApi;
