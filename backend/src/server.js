import env from "./config/env.js";
import app from "./app.js";

process.env.TZ = process.env.TZ ?? env.app.timezone;

app.listen(env.app.port, () => {
  console.info(
    `${env.app.name} listening on http://localhost:${env.app.port} (${env.app.timezone})`,
  );
});

