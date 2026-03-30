import dotenv from "dotenv";

dotenv.config();

const env = {
  app: {
    name: process.env.APP_NAME ?? "CoreSys API",
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    timezone: process.env.APP_TIMEZONE ?? "America/Mexico_City",
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  },
  database: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    name: process.env.DB_NAME ?? "coresys",
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
  },
};

export default env;

