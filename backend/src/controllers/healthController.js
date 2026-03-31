import { createSuccessResponse } from "../utils/apiResponse.js";

const APP_NAME = "CoreSys API";
const APP_NODE_ENV = process.env.NODE_ENV ?? "development";
const APP_TIMEZONE = "America/Mexico_City";

export const getHealth = (_req, res) => {
  res.json(
    createSuccessResponse({
      message: "CoreSys API lista para desarrollo.",
      data: {
        service: APP_NAME,
        nodeEnv: APP_NODE_ENV,
        timezone: APP_TIMEZONE,
      },
    }),
  );
};
