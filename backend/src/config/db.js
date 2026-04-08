import mysql from 'mysql2/promise';

import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export const checkDatabaseConnection = async () => {
  try {
    await pool.query('SELECT 1 AS ok');
    return {
      status: 'connected'
    };
  } catch (error) {
    return {
      status: 'unavailable',
      message: env.isProduction ? 'Base de datos no disponible.' : error.message
    };
  }
};

export default pool;
