import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import OtpVerification from "../pages/OtpVerification";
import ResetPassword from "../pages/ResetPassword";
import Home from "../pages/Home";
import ProtectedRoute from "../common/protectedRoute";
import BookService from "../pages/BookService";
import Categories from "../components/Categories";
import Bookings from "../components/Bookings";
import Services from "../components/Services";
import YourServices from "../components/YourServices";
import ServiceDetails from "../pages/ServiceDetails";
import CategoryServices from "../components/CategoryServices";
import Review from "../components/Review";
import Recommendation from "../components/Recommendation";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Public routes
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "verification-otp", element: <OtpVerification /> },
      { path: "reset-password", element: <ResetPassword /> },

      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/",
            element: <Home />,
            children: [
              { index: true, element: <Categories /> },
              {path: "recommendations", element: <Recommendation />},
              { path: "bookings", element: <Bookings /> },
              { path: "services", element: <Services /> },
              { path: "services/category/:categoryId", element: <CategoryServices /> }, // Add this line
              { path: "service/:serviceId", element: <ServiceDetails /> },
              { path: "review/:bookingId", element: <Review /> },
            ],
          },
          { path: "book-service/:serviceId", element: <BookService /> },
        ],
      },
    ],
  },
]);

export default router;
