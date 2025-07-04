import { Router } from "express";
import {
  getBookings,
  updateStatus,
  getMyBookings,
  createBooking,
  getCustomerNameByBookingId,
  getProviderNameByBookingId,
} from "../controllers/booking.controller.js";
import auth from "../middleware/auth.js";

const bookingRouter = Router();

bookingRouter.get("/get-bookings", auth, getBookings);
bookingRouter.get("/my-bookings", auth, getMyBookings); // Add this route
bookingRouter.post("/update-booking-status/:bookingId", auth, updateStatus);
bookingRouter.post("/create-booking/:serviceId", auth, createBooking);
bookingRouter.get("/customer-name/:bookingId", auth, getCustomerNameByBookingId);
bookingRouter.get("/provider-name/:bookingId", auth, getProviderNameByBookingId);

export default bookingRouter;
