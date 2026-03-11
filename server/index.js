import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { connectDB } from "./config/db.js";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hotelRouter from "./routes/hotel.routes.js";
import authRouter from "./routes/auth.routes.js";
import roomRouter from "./routes/room.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import reviewRouter from "./routes/review.routes.js";
import loyaltyRouter from "./routes/loyalty.routes.js";
import redemptionRouter from "./routes/redemption.routes.js";
import managerRouter from "./routes/manager.routes.js";
import adminRouter from "./routes/admin.routes.js";
import cookieParser from "cookie-parser";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const app = express();
const PORT = process.env.PORT || 5600;
connectDB();
app.use(cors({origin: ["http://localhost:5173", "http://192.168.0.115:5173", "http://127.0.0.1:5173"],credentials: true}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
const limiter = rateLimit({windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true,legacyHeaders: false,});
app.use(limiter);

// ENDPOINTS
app.get("/", (req, res) => {
    res.send("Server is running perfectly!!!");
});
app.use("/api/auth", authRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/loyalty", loyaltyRouter);
app.use("/api/redemptions", redemptionRouter);
app.use("/api/manager", managerRouter);
app.use("/api/admin", adminRouter);


app.use((err, req, res, next) => {
    console.error("Error:", err);
    if (err && err.stack) console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Server error"
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
