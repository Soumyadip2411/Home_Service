import { Router } from "express";
import {
  getBookings,
  updateStatus,
  getMyBookings,
  createBooking,
  getCustomerNameByBookingId,
  getProviderNameByBookingId,
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

export default bookingRouter;
