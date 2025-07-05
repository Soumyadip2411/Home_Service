import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/connectDB.js";
import userRouter from "./route/user.route.js";
import bookingRouter from "./route/booking.route.js";
import uploadRouter from "./route/upload.router.js";
import categoryRouter from "./route/category.route.js";
import errorHandler from './middleware/errorHandler.js';
import serviceRouter from './route/service.route.js';
import interactionRouter from "./route/interaction.route.js";
import recommendationRouter from "./route/recommendation.route.js";
import reviewRouter from "./route/review.route.js";
import chatRoomRouter from "./route/chatRoom.route.js";
import botRouter from "./route/bot.route.js";
import botChatRouter from './route/botChat.route.js';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: "50mb" })); // for JSON payloads
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // optional for form fields

app.use(cookieParser());
//app.use(morgan());
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const PORT = 8080 || process.env.PORT;

app.get("/", (request, response) => {
  ///server to client
  response.json({
    message: "Server is running " + PORT,
  });
});

app.use("/api/user", userRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/category", categoryRouter);
app.use("/api/service",serviceRouter)
app.use("/api/interactions",interactionRouter);
app.use("/api/recommendations",recommendationRouter);
app.use("/api/review", reviewRouter);
app.use("/api/chat", chatRoomRouter);
app.use("/api/chat/bot", botRouter);
app.use('/api/chat/bot-chat', botChatRouter);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running", PORT);
  });
});

// Add this after your routes
app.use(errorHandler);
