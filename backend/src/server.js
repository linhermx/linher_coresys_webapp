import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const APP_NAME = "CoreSys API";
const APP_PORT = Number(process.env.PORT ?? 4000);
const APP_TIMEZONE = "America/Mexico_City";

process.env.TZ = process.env.TZ ?? APP_TIMEZONE;

app.listen(APP_PORT, () => {
  console.info(
    `${APP_NAME} listening on http://localhost:${APP_PORT} (${APP_TIMEZONE})`,
  );
});
