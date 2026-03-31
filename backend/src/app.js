import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import requestContext from "./middleware/requestContext.js";
import errorHandler from "./middleware/errorHandler.js";
import notFoundHandler from "./middleware/notFoundHandler.js";
import apiRoutes from "./routes/index.js";
import { createSuccessResponse } from "./utils/apiResponse.js";

dotenv.config();

const app = express();
const APP_NAME = "CoreSys API";
const APP_TIMEZONE = "America/Mexico_City";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestContext);

app.get("/", (_req, res) => {
  res.json(
    createSuccessResponse({
      message: "CoreSys API base disponible.",
      data: {
        service: APP_NAME,
        timezone: APP_TIMEZONE,
      },
    }),
  );
});

app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
