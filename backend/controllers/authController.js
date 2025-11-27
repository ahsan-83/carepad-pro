const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { initializeConnection, customConnection } = require("../config/database");


const SECRET_KEY = "4363b1c8117514b1596fd692e7eb6dee5f70e75168edc14fa02c25a00f142b1f"
const REFRESH_SECRET_KEY = "6164d802eda6d603e5009cb0c08c2328786e8f5005ebf2a71e3b64a163505cc9"


exports.register = async (req, res) => {

  try {
    const { name, email, bmdc, phone, password, promoCode, db_host, db_user, db_password, db_name } = req.body;

    // 1️⃣ Validate missing fields
    if (!name || !email || !bmdc || !phone || !password || !promoCode || !db_host || !db_user || !db_password ||  !db_name  ) {
      return res
        .status(400)
        .json({ message: "All fields are required", code: "MISSING_FIELDS" });
    }

    // 2️⃣ Validate promo code
    if (promoCode !== "Z8#KQ4@M2!RF7^HL9%T*") {
      return res
        .status(400)
        .json({ message: "Invalid promo code", code: "INVALID_PROMO" });
    }

    const connection = await initializeConnection();

    // 3️⃣ Ensure table exists
    const doctorsTableSchema = `
      CREATE TABLE IF NOT EXISTS doctors (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        bmdc VARCHAR(32) UNIQUE NOT NULL,
        phone VARCHAR(32) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        imageURL VARCHAR(512) NULL,
        specialty VARCHAR(100) NULL,
        address VARCHAR(255) NULL,
        consultlocation VARCHAR(255) NULL,
        refreshtoken VARCHAR(255) NULL,
        db_host VARCHAR(50) NULL,
        db_user VARCHAR(50) NULL,
        db_password VARCHAR(50) NULL,
        db_name VARCHAR(50) NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(doctorsTableSchema);

    // 4️⃣ Check if doctor already exists by email, bmdc, or phone
    const [existing] = await connection.query(
      "SELECT email, bmdc, phone FROM doctors WHERE email = ? OR bmdc = ? OR phone = ? LIMIT 1",
      [email, bmdc, phone]
    );

    if (existing.length > 0) {
      const conflict = existing[0];
      let reason = "User already registered";

      if (conflict.email === email) reason = "Email already in use";
      else if (conflict.bmdc === bmdc)
        reason = "BMDC number already registered";
      else if (conflict.phone === phone)
        reason = "Phone number already registered";

      return res.status(409).json({ message: reason, code: "DUPLICATE_USER" });
    }

    // 5️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6️⃣ Insert doctor
    const [result] = await connection.query(
      `INSERT INTO doctors (name, email, bmdc, phone, password, db_host, db_user, db_password, db_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, bmdc, phone, hashedPassword, db_host, db_user, db_password, db_name]
    );

    const doctorId = result.insertId;
    connection.end();

    // 7️⃣ Create related tables
    const patientTable = `patient_${bmdc}`;
    const consultationTable = `consultation_${bmdc}`;

    const patientTableSchema = `
      CREATE TABLE IF NOT EXISTS \`${patientTable}\` (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        doctor_id INT UNSIGNED NOT NULL,
        name VARCHAR(100) NOT NULL,
        age INT NULL,
        sex VARCHAR(10) NULL,
        address VARCHAR(100) NULL,
        phone VARCHAR(20) NULL,
        email VARCHAR(100) NULL,
        height DECIMAL(5,2) NULL,
        weight DECIMAL(5,2) NULL,
        bloodGroup VARCHAR(10) NULL,
        dob DATE NULL,
        lastConsultationId INT UNSIGNED NULL,
        consultlocation VARCHAR(100) NULL,
        treatmentStatus VARCHAR(20) NULL,
        disease VARCHAR(100) NULL,
        registrationDate DATE NULL,
        recentAppointmentDate DATE NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const consultationTableSchema = `
      CREATE TABLE IF NOT EXISTS \`${consultationTable}\` (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        doctor_id INT UNSIGNED NOT NULL,
        serialNo INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        age INT NOT NULL,
        sex VARCHAR(20) NOT NULL,
        email VARCHAR(100) NULL,
        phone VARCHAR(50) NOT NULL,
        address VARCHAR(1024) NULL,
        consultLocationId INT UNSIGNED NOT NULL, 
        date DATETIME NOT NULL,
        timeSlotId INT UNSIGNED NOT NULL, 
        patientId INT NULL,
        consultType VARCHAR(20) NULL,
        consultationFee INT NULL,
        paymentStatus VARCHAR(20) NULL DEFAULT 'pending',
        appointmentStatus VARCHAR(20) NULL,
        patientAdvice VARCHAR(512) NULL,
        disease VARCHAR(100) NULL,
        followUp DATE NULL,
        prescription VARCHAR(512) NULL,
        medical_report VARCHAR(512) NULL,
        symptoms_list VARCHAR(512) NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (consultLocationId) REFERENCES consultation_locations(id) ON DELETE CASCADE, 
        FOREIGN KEY (timeSlotId) REFERENCES time_slots(id) ON DELETE CASCADE 
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const activeDayTableSchema = `
      CREATE TABLE IF NOT EXISTS active_days (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT,
          location_id INT UNSIGNED NOT NULL,
          day ENUM(
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
          ) NOT NULL,
          isActive TINYINT(1) NOT NULL DEFAULT 0,
          PRIMARY KEY (id),
          INDEX (location_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    
    const locationTableSchema = `
        CREATE TABLE IF NOT EXISTS consultation_locations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      doctor_id INT UNSIGNED NOT NULL,
      locationName VARCHAR(255) NOT NULL,
      address VARCHAR(512) NOT NULL,
      locationType ENUM('Hospital', 'Clinic', 'Chamber') NOT NULL,
      roomNumber VARCHAR(50) NULL,
      consultationFee INT NOT NULL,
      isPublished TINYINT(1) DEFAULT 0,
      PRIMARY KEY (id),
      INDEX (doctor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

    const timeSlotTableSchema = `
        CREATE TABLE IF NOT EXISTS time_slots (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      active_day_id INT UNSIGNED NOT NULL,
      slotActive TINYINT(1) NOT NULL DEFAULT 0,
      startTime TIME NOT NULL,
      endTime TIME NOT NULL,
      slotDuration INT NOT NULL,
      capacity INT NOT NULL,
      PRIMARY KEY (id),
      INDEX (active_day_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

    const doctorDegreeTableSchema = `
      CREATE TABLE IF NOT EXISTS doctor_degrees (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      doctor_id INT UNSIGNED NOT NULL,
      degreeName VARCHAR(255) NOT NULL,
      institution VARCHAR(255) NOT NULL,
      year INT NOT NULL,
      PRIMARY KEY (id),
      INDEX (doctor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

    
  const profile_info_table_schema = `CREATE TABLE IF NOT EXISTS profile_info (
                                id INT NOT NULL AUTO_INCREMENT,
                                name VARCHAR(100)  ,
                                mobile VARCHAR(20)  ,
                                bmdc VARCHAR(10)  ,
                                email VARCHAR(50)  ,
                                specialty VARCHAR(50)  ,
                                experience INT  ,
                                department VARCHAR(50)  ,
                                hospital VARCHAR(100)  ,
                                shortBio VARCHAR(500)  ,
                                about VARCHAR(2000)  ,
                                PRIMARY KEY (id)
)`;

  const specialty_table_schema = `CREATE TABLE IF NOT EXISTS specialty (
                                id INT NOT NULL AUTO_INCREMENT,
                                name VARCHAR(50)  ,
                                description VARCHAR(200)  ,
                                PRIMARY KEY (id)
)`;


  const disease_table_schema = `CREATE TABLE IF NOT EXISTS disease (
                                id INT NOT NULL AUTO_INCREMENT,
                                name VARCHAR(50),
                                description VARCHAR(200),
                                symptoms VARCHAR(600),
                                treatment VARCHAR(4000),
                                PRIMARY KEY (id)
)`;

  const experience_table_schema = `CREATE TABLE IF NOT EXISTS experience (
                                id INT NOT NULL AUTO_INCREMENT,
                                position VARCHAR(30)  ,
                                institution VARCHAR(50)  ,
                                year VARCHAR(20)  ,
                                description VARCHAR(200)  ,
                                PRIMARY KEY (id)
)`;

  const education_table_schema = `CREATE TABLE IF NOT EXISTS education (
                                id INT NOT NULL AUTO_INCREMENT,
                                degree VARCHAR(30)  ,
                                institution VARCHAR(50)  ,
                                year VARCHAR(20)  ,
                                description VARCHAR(200)  ,
                                PRIMARY KEY (id)
)`;

  const certificate_table_schema = `CREATE TABLE IF NOT EXISTS certificate (
                                id INT NOT NULL AUTO_INCREMENT,
                                name VARCHAR(50)  ,
                                provider VARCHAR(50)  ,
                                year VARCHAR(20)  ,
                                PRIMARY KEY (id)
)`;

  const membership_table_schema = `CREATE TABLE IF NOT EXISTS membership (
                                id INT NOT NULL AUTO_INCREMENT,
                                name VARCHAR(50),
                                institution VARCHAR(50),
                                year VARCHAR(20),
                                description VARCHAR(200),
                                PRIMARY KEY (id)
)`;

  const award_table_schema = `CREATE TABLE IF NOT EXISTS award (
                                id INT NOT NULL AUTO_INCREMENT,
                                name VARCHAR(50),
                                institution VARCHAR(50),
                                year VARCHAR(20),
                                reason VARCHAR(200),
                                PRIMARY KEY (id)
)`;

  const video_table_schema = `CREATE TABLE IF NOT EXISTS video (
                                id INT NOT NULL AUTO_INCREMENT,
                                title VARCHAR(100),
                                videoURL VARCHAR(300),
                                PRIMARY KEY (id)
)`;

  const location_table_schema = `CREATE TABLE IF NOT EXISTS consultation_location (
                                id INT NOT NULL AUTO_INCREMENT,
                                name VARCHAR(50) ,
                                address VARCHAR(200) ,
                                contact VARCHAR(20) ,
                                day_time VARCHAR(600) ,
                                googleURL VARCHAR(400) ,
                                PRIMARY KEY (id)
)`;

  const contact_table_schema = `CREATE TABLE IF NOT EXISTS contact (
                                id INT NOT NULL AUTO_INCREMENT,
                                phone VARCHAR(20),
                                email VARCHAR(50),
                                address VARCHAR(200),
                                day_time VARCHAR(600),
                                googleURL VARCHAR(400),
                                facebookURL VARCHAR(100),
                                twitterURL VARCHAR(100),
                                linkedinURL VARCHAR(100),
                                PRIMARY KEY (id)
)`;

  const gallery_table_schema = `CREATE TABLE IF NOT EXISTS gallery (
                                id INT NOT NULL AUTO_INCREMENT,
                                image LONGBLOB,
                                mimetype VARCHAR(20),
                                PRIMARY KEY (id)
)`;

  const profile_image_table_schema = `CREATE TABLE IF NOT EXISTS profile_image (
                                id INT NOT NULL AUTO_INCREMENT,
                                image LONGBLOB,
                                mimetype VARCHAR(20),
                                PRIMARY KEY (id)
)`;

  const social_media_table_schema = `CREATE TABLE IF NOT EXISTS facebook_post (
                                id INT NOT NULL AUTO_INCREMENT,
                                postURL VARCHAR(300),
                                PRIMARY KEY (id)
)`;

    const customDBConnection = await customConnection(db_host,db_user,db_password,db_name);

    await Promise.all([
      customDBConnection.query(activeDayTableSchema),
      customDBConnection.query(locationTableSchema),
      customDBConnection.query(timeSlotTableSchema),
      customDBConnection.query(doctorDegreeTableSchema),
      customDBConnection.query(patientTableSchema),
      customDBConnection.query(consultationTableSchema),
      customDBConnection.query(profile_info_table_schema),
      customDBConnection.query(specialty_table_schema),
      customDBConnection.query(disease_table_schema),
      customDBConnection.query(experience_table_schema),
      customDBConnection.query(education_table_schema),
      customDBConnection.query(certificate_table_schema),
      customDBConnection.query(membership_table_schema),
      customDBConnection.query(award_table_schema),
      customDBConnection.query(video_table_schema),
      customDBConnection.query(social_media_table_schema),  
      customDBConnection.query(location_table_schema),
      customDBConnection.query(contact_table_schema),
      customDBConnection.query(gallery_table_schema),
      customDBConnection.query(profile_image_table_schema),
    ]);

    customDBConnection.end();

    res.status(201).json({ message: "User registered successfully", doctorId });
  } catch (error) {
    console.error("Error during registration:", error);
    res
      .status(500)
      .json({ message: "Internal server error", code: "SERVER_ERROR" });
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

    const token = jwt.sign(
      { id: doctor.id, username: doctor.email },
      SECRET_KEY,
      { expiresIn: "48h" }
    );

    const refreshToken = jwt.sign(
      { id: doctor.id, username: doctor.email },
      REFRESH_SECRET_KEY
    );

    // Store refresh token in DB
    const updateTokenSql = "UPDATE doctors SET refreshtoken = ? WHERE id = ?";
    await connection.query(updateTokenSql, [refreshToken, doctor.id]);

    const bmdc = doctor.bmdc;

    // FINAL doctorInfo object (secure)
    const doctorInfo = {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      imageURL: doctor.imageURL,
      bmdc: doctor.bmdc,
      specialty: doctor.specialty,
      address: doctor.address,
      phone: doctor.phone,
      consultlocation: doctor.consultlocation,
      db_host: doctor.db_host,
      db_user: doctor.db_user,
      db_password: doctor.db_password,
      db_name: doctor.db_name,
    };

    connection.end();

    res.json({
      token,
      refreshToken,
      bmdc,
      doctorInfo,
    });
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
    const newToken = jwt.sign(
      { id: doctor.id, username: doctor.email },
      SECRET_KEY,
      { expiresIn: "48h" }
    );

    connection.end();

    res.json({ token: newToken });
  } catch (error) {
    console.error("Error during token refresh:", error);
    res.status(403).send("Invalid refresh token");
  }
};
