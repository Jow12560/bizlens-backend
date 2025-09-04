import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import corsOptions from "./middleware/corsOptions.js";
import loginRouter from "./routes/login.route.js";
import userRouter from "./routes/user.route.js";
import dotenv from "dotenv";




dotenv.config(); // ✅ Load environment variables

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// ✅ Health Check Endpoint (To confirm successful deployment)
app.get("/", (req, res) => {
  res.send("🔥 PROWOLO BACKEND DEPLOYED ON RENDER SUCCESSFULLY 🔥");
});

// API Routes
app.use("/login", loginRouter);
app.use("/user", userRouter);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

export default app;

