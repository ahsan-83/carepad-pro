require("dotenv").config();
const mysql = require("mysql2/promise");

async function initializeConnection() {

  try {
    const connectionConfig = {
      host: "srv1673.hstgr.io",
      user: "u186255566_admin",
      password: "p17uGtoC8@",
      database: "u186255566_carepad",
      dateStrings: true,
      timezone: "+06:00",
      connectTimeout: 15000, // 15 seconds
    };

    const connection = await mysql.createConnection(connectionConfig);

    return connection;
  } catch (err) {
    console.error("🟥 [DB] Error connecting to MySQL:", err);
    throw err;
  }
}

async function customConnection(db_host, db_user, db_password, db_name) {

  try {
    const connectionConfig = {
      host: db_host,
      user: db_user,
      password: db_password,
      database: db_name,
      dateStrings: true,
      timezone: "+06:00",
      connectTimeout: 15000, // 15 seconds
    };

    const connection = await mysql.createConnection(connectionConfig);

    return connection;
  } catch (err) {
    console.error("🟥 [DB] Error connecting to Custom MySQL:", err);
    throw err;
  }
}

module.exports = { initializeConnection, customConnection };

