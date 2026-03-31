import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DB_HOST = process.env.DB_HOST ?? "localhost";
const DB_PORT = Number(process.env.DB_PORT ?? 3306);
const DB_USER = process.env.DB_USER ?? "root";
const DB_PASS = process.env.DB_PASS ?? "";
const DB_NAME = process.env.DB_NAME ?? "linher_coresys";
const DB_CONNECTION_LIMIT = Number(process.env.DB_CONNECTION_LIMIT ?? 10);

let pool;

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: DB_CONNECTION_LIMIT,
      namedPlaceholders: true,
      timezone: "local",
    });
  }

  return pool;
};

export const testDatabaseConnection = async () => {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();

    return {
      connected: true,
      database: DB_NAME,
    };
  } catch (error) {
    return {
      connected: false,
      database: DB_NAME,
      error: error.message,
    };
  }
};
