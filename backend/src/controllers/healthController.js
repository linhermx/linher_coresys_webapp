import env from "../config/env.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const getHealth = (_req, res) => {
  res.json(
    createSuccessResponse({
      message: "CoreSys API lista para desarrollo.",
      data: {
        service: env.app.name,
        nodeEnv: env.app.nodeEnv,
        timezone: env.app.timezone,
      },
    }),
  );
};

