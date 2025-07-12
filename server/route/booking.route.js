import { Router } from "express";
import {
  getBookings,
  updateStatus,
  getMyBookings,
  createBooking,
  getCustomerNameByBookingId,
  getProviderNameByBookingId,
  getCustomerDetailsByBookingId,
  getProviderDetailsByBookingId,
  getBookingById,
} from "../controllers/booking.controller.js";
import auth from "../middleware/auth.js";

const bookingRouter = Router();

bookingRouter.get("/get-bookings", auth, getBookings);
bookingRouter.get("/my-bookings", auth, getMyBookings);
bookingRouter.get("/:bookingId", auth, getBookingById);
bookingRouter.post("/update-booking-status/:bookingId", auth, updateStatus);
bookingRouter.post("/", auth, createBooking);
bookingRouter.get("/customer-name/:bookingId", auth, getCustomerNameByBookingId);
bookingRouter.get("/provider-name/:bookingId", auth, getProviderNameByBookingId);
bookingRouter.get("/customer-details/:bookingId", auth, getCustomerDetailsByBookingId);
bookingRouter.get("/provider-details/:bookingId", auth, getProviderDetailsByBookingId);

export default bookingRouter;
