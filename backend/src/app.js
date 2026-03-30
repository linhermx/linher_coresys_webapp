import express from "express";
import cors from "cors";
import env from "./config/env.js";
import requestContext from "./middleware/requestContext.js";
import errorHandler from "./middleware/errorHandler.js";
import notFoundHandler from "./middleware/notFoundHandler.js";
import apiRoutes from "./routes/index.js";
import { createSuccessResponse } from "./utils/apiResponse.js";

const app = express();

app.use(
  cors({
    origin: env.app.corsOrigin,
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
        service: env.app.name,
        timezone: env.app.timezone,
      },
    }),
  );
});

app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
