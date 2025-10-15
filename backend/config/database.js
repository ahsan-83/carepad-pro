const mysql = require("mysql2/promise");

async function initializeConnection() {
  try {
    //constconnectionConfig = {
    //  host: process.env.DB_HOST,
    //  user: process.env.DB_USER,
    //  password: process.env.DB_PASSWORD,
    //  database: process.env.DB_NAME,
    //};

    const connectionConfig = {
      //host: "carepad.ctuissq42950.ap-southeast-2.rds.amazonaws.com",
	  host: "mysql-203508-0.cloudclusters.net",
	  port: "19998",
	  user: "admin",
      //password: "p17uGtoC8",
	  password: "4fmrG7kC",
	  database: "carepad",
	  waitForConnections: true,
    };

    const connection = await mysql.createConnection(connectionConfig);

    return connection;
  } catch (err) {
    console.error("Error connecting to database:", err);
    throw err;
  }
}

module.exports = { initializeConnection };