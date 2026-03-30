import mysql from "mysql2/promise";
import env from "./env.js";

let pool;

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: env.database.host,
      port: env.database.port,
      user: env.database.user,
      password: env.database.password,
      database: env.database.name,
      waitForConnections: true,
      connectionLimit: env.database.connectionLimit,
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
      database: env.database.name,
    };
  } catch (error) {
    return {
      connected: false,
      database: env.database.name,
      error: error.message,
    };
  }
};
