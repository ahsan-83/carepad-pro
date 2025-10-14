const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { initializeConnection } = require("../config/database");

// Load environment variables
require('dotenv').config();

const SECRET_KEY = "4363b1c8117514b1596fd692e7eb6dee5f70e75168edc14fa02c25a00f142b1f"
const REFRESH_SECRET_KEY = "6164d802eda6d603e5009cb0c08c2328786e8f5005ebf2a71e3b64a163505cc9"

exports.register = async (req, res) => {
  try {

    const { name, email, imageURL, bmdc, specialty, address, phone, affiliation, consultlocation, password } = req.body;

    const patient_db = "patient_" +  bmdc;
    const consultation_db = "consultation_"+ bmdc;
    const event_db = "event_" + bmdc;

    const connection = await initializeConnection();

    const result = await connection.query("SELECT * FROM doctors WHERE email = ?",[email]);

    if(result[0].length > 0){
      return res.status(409).send("User already registered with the email");
    }

    patient_table_schema = `CREATE TABLE IF NOT EXISTS \`${patient_db}\` (
                            id INT NOT NULL AUTO_INCREMENT,
                            name VARCHAR(100) NOT NULL,
                            imageURL VARCHAR(512),
                            age INT NOT NULL,
                            sex VARCHAR(10) NOT NULL,
                            address VARCHAR(100) NOT NULL,
                            height DECIMAL NOT NULL,
                            weight DECIMAL NOT NULL,
                            phone VARCHAR(20) UNIQUE NOT NULL,
                            email VARCHAR(50) UNIQUE NOT NULL,
                            bloodGroup VARCHAR(10) NOT NULL,
                            dob DATE NOT NULL,
                            consultlocation VARCHAR(100) NOT NULL,
                            treatmentStatus VARCHAR(20) NOT NULL,
                            disease VARCHAR(100),
                            registrationDate DATE,
                            recentAppointmentDate DATE,
                            PRIMARY KEY (id)
    )`; 
  
    consultation_table_schema = `CREATE TABLE IF NOT EXISTS \`${consultation_db}\` (
                                id INT NOT NULL AUTO_INCREMENT,
                                patientId INT NOT NULL,
                                consultlocation VARCHAR(100) NOT NULL,
                                consultType VARCHAR(20) NOT NULL,
                                dateTime DATETIME NOT NULL,
                                patientCondition VARCHAR(1024),
                                consultationFee INT NOT NULL,
                                appointmentStatus VARCHAR(20) NOT NULL,
                                audioURL VARCHAR(512),
                                medicalTests VARCHAR(512),
                                medicalReports VARCHAR(1024),
                                medicalFiles VARCHAR(1024),
                                reportComments VARCHAR(1024),
                                patientAdvice VARCHAR(1024),
                                medicine VARCHAR(512),
                                doctorNotes VARCHAR(1024),
                                recoveryStatus INT,
                                disease VARCHAR(100),
                                followUp DATE,
                                PRIMARY KEY (id)
)`;

    /*event_table_schema = `CREATE TABLE IF NOT EXISTS \`${event_db}\` (
                                id INT NOT NULL AUTO_INCREMENT,
                                dateFrom DATETIME NOT NULL,
                                dateTo DATETIME NOT NULL,
                                allDay BOOLEAN NOT NULL,
                                title VARCHAR(50) NOT NULL,
                                eventType VARCHAR(20) NOT NULL,
                                location VARCHAR(20) NOT NULL,
                                reminderType INT NOT NULL,
                                PRIMARY KEY (id)
)`;*/

    
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO doctors (name, email, imageURL, bmdc, specialty, address, phone, affiliation, consultlocation, password ) VALUES (?, ?, ?,?, ?, ?,?, ?, ?,?)";
    await connection.query(sql, [name, email, imageURL, bmdc, specialty, address, phone, affiliation, consultlocation, hashedPassword]);

    await connection.query(patient_table_schema);
    console.log("Patient table created");

    await connection.query(consultation_table_schema);
    console.log("Consultation table created");

    //await connection.query(event_table_schema);
   // console.log("Event table created");
    
    res.status(201).send("User registered successfully");
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send("Error registering user");
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const connection = await initializeConnection();
    const sql = "SELECT * FROM doctors WHERE email = ?";
    const [results] = await connection.query(sql, [email]);

    if (results.length === 0) {
      return res.status(401).send("Invalid email");
    }

    const doctor = results[0];
    const passwordMatch = await bcrypt.compare(password, doctor.password);
    if (!passwordMatch) {
      return res.status(401).send("Invalid password");
    }

    const token = jwt.sign({ id: doctor.id, username: doctor.email }, SECRET_KEY, { expiresIn: "48h" });
    const refreshToken = jwt.sign({ id: doctor.id, username: doctor.email }, REFRESH_SECRET_KEY);

    //console.log(refreshToken);

    // Store the refresh token in the database
    const updateTokenSql = "UPDATE doctors SET refreshtoken = ? WHERE id = ?";
    await connection.query(updateTokenSql, [refreshToken, doctor.id]);

    const bmdc = results[0].bmdc;

    res.json({ token, refreshToken, bmdc });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Error logging in");
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).send("Refresh token is required");
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET_KEY);
    const connection = await initializeConnection();
    const sql = "SELECT * FROM doctors WHERE id = ? AND refreshtoken = ?";
    const [results] = await connection.query(sql, [decoded.id, refreshToken]);

    if (results.length === 0) {
      return res.status(403).send("Invalid refresh token");
    }

    const doctor = results[0];
    const newToken = jwt.sign({ id: doctor.id, username: doctor.email }, SECRET_KEY, { expiresIn: "48h" });

    res.json({ token: newToken });
  } catch (error) {
    console.error("Error during token refresh:", error);
    res.status(403).send("Invalid refresh token");
  }
};
