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
import BookingsPage from "../pages/Bookings";
import BookingsComponent from "../components/Bookings";
import Services from "../components/Services";
import YourServices from "../components/YourServices";
import ServiceDetails from "../pages/ServiceDetails";
import CategoryServices from "../components/CategoryServices";
import Review from "../components/Review";
import Recommendation from "../components/Recommendation";
import ChatPage from '../pages/ChatPage';
import BotChat from '../pages/BotChat';
import { useSelector } from 'react-redux';
import React from 'react';

function BookingsRoleBased() {
  const role = useSelector(state => state.user.role);
  if (role === 'PROVIDER') return <BookingsComponent />;
  return <BookingsPage />;
}

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
              { path: "recommendations", element: <Recommendation /> },
              { path: "bookings", element: <BookingsRoleBased /> },
              
              { path: "services", element: <Services /> },
              { path: "services/category/:categoryId", element: <CategoryServices /> },
              { path: "service/:serviceId", element: <ServiceDetails /> },
              { path: "review/:bookingId", element: <Review /> },
              
            ],
            
          },
          { path: "chat/:bookingId", element: <ChatPage /> },
          { path: "bot-chat", element: <BotChat /> },
          { path: "book-service/:serviceId", element: <BookService /> },
        ],
      },
    ],
  },
]);

export default router;
