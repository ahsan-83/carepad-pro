const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}


exports.updatePatient = async (req, res) => {
  const {
    id,
    name,
    age,
    sex,
    address,
    height,
    weight,
    phone,
    email,
    bloodGroup,
    dob,
    consultlocation,
  } = req.body;

  const bmdc = req.headers["bmdc"];

  const patient_db = "patient_" + bmdc;

  try {
    const connection = await createCustomConnection(req);
    const query = `UPDATE \`${patient_db}\`  SET name = ?, age = ?, sex = ?, address = ?, height = ?, weight = ?, phone = ?, email = ?, bloodGroup = ?, dob = ?, consultlocation = ? WHERE id = ?`;
    const result = await connection.query(query, [
      name,
      age,
      sex,
      address,
      height,
      weight,
      phone,
      email,
      bloodGroup,
      dob,
      consultlocation,
      id,
    ]);

    connection.end();

    return res.status(200).send("Profile updated successfully");
  } catch (error) {
    console.error("Profile update error: ", error);
    return res.status(500).send("Profile update error");
  }
};

exports.getPatientById = async (req, res) => {
  const { patientId } = req.body;
  const bmdc = req.headers["bmdc"];

  const patient_db = "patient_" + bmdc;

  const sql = `SELECT * FROM \`${patient_db}\` WHERE id = ?`;

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql, [patientId]);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Patient not found");
    } else {
      res.json(results[0]);
    }
  } catch (error) {
    console.error("Error fetching patient details:", error);
    res.status(500).send("Error fetching patient details");
  }
};

exports.getPatients = async (req, res) => {
  const {
    disease,
    sex,
    consultlocation,
    treatmentStatus,
    slotTime,
    recentAppointmentDate,
    search,
  } = req.body;

  const bmdc = req.headers["bmdc"];

  try {

    const patientTable = `patient_${bmdc}`;
    const consultationTable = `consultation_${bmdc}`;

    const conditions = [];
    const params = [];

    // 🧩 Filters
    if (disease && disease !== "None") {
      conditions.push("p.disease = ?");
      params.push(disease);
    }
    if (sex && sex !== "None") {
      conditions.push("p.sex = ?");
      params.push(sex);
    }
    if (consultlocation && consultlocation !== "None") {
      conditions.push("cl.locationName = ?");
      params.push(consultlocation);
    }
    if (treatmentStatus && treatmentStatus !== "None") {
      conditions.push("p.treatmentStatus = ?");
      params.push(treatmentStatus);
    }
    if (slotTime && slotTime !== "None") {
      // ✅ filter by timeSlotId from consultation table
      conditions.push("ts.id = ?");
      params.push(slotTime);
    }
    if (recentAppointmentDate && recentAppointmentDate !== "None") {
      conditions.push("DATE(p.recentAppointmentDate) = ?");
      params.push(recentAppointmentDate);
    }
    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      conditions.push("(p.name LIKE ? OR p.phone LIKE ? OR p.email LIKE ?)");
      params.push(term, term, term);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // ✅ Join patient -> consultation -> location -> timeslot
    const sql = `
      SELECT 
        p.id,
        p.doctor_id,
        p.lastConsultationId,
        p.name,
        p.age,
        p.sex,
        p.address,
        p.phone,
        p.email,
        p.height,
        p.weight,
        p.bloodGroup,
        p.dob,
        p.treatmentStatus,
        p.disease,
        p.registrationDate,
        p.recentAppointmentDate,

        -- 🧩 Consultation info (from consultation_{bmdc})
        c.consultLocationId,
        c.timeSlotId,
        c.date AS consultationDate,
        c.consultType,
        c.consultationFee,
        c.appointmentStatus,

        -- 🏥 Consultation Location details
        cl.locationName AS consultLocationName,
        cl.address AS consultAddress,
        cl.locationType AS consultLocationType,
        cl.roomNumber AS consultRoom,
        cl.consultationFee AS consultFee,

        -- ⏰ Time Slot details
        ts.id AS timeSlotId,
        ts.startTime,
        ts.endTime,
        ts.slotDuration,
        ts.capacity

      FROM \`${patientTable}\` p
      LEFT JOIN \`${consultationTable}\` c 
        ON c.id = p.lastConsultationId
      LEFT JOIN consultation_locations cl 
        ON cl.id = c.consultLocationId
      LEFT JOIN time_slots ts 
        ON ts.id = c.timeSlotId
      ${whereClause}
      ORDER BY p.recentAppointmentDate DESC;
    `;

    const connection = await createCustomConnection(req);
    const [rows] = await connection.query(sql, params);
    connection.end();

    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error fetching patients:", error);
    res.status(500).json({ message: "Error fetching patients" });
  }
};

exports.getAllConsultationsWithPatient = async (req, res) => {
  const { consultationId, patientId } = req.body;

  const bmdc = req.headers["bmdc"];

  try {

    const consultation_db = `consultation_${bmdc}`;
    const patient_db = `patient_${bmdc}`;

    // ✅ 1️⃣ Get all finished consultations for that patient except current one
    const sqlConsultations = `
      SELECT * 
      FROM \`${consultation_db}\`
      WHERE patientId = ?  
      ORDER BY date DESC
    `;

    const connection = await createCustomConnection(req);

    const [consultationRows] = await connection.query(sqlConsultations, [
      patientId,
    ]);


    // ✅ 2️⃣ Get full patient details
    const sqlPatient = `
      SELECT *
      FROM \`${patient_db}\`
      WHERE id = ?
    `;

    const [patientRows] = await connection.query(sqlPatient, [patientId]);

    connection.end();

    // ✅ 3️⃣ Combine and send
    return res.status(200).json({
      patient: patientRows.length > 0 ? patientRows[0] : null,
      consultations: consultationRows,
    });
  } catch (error) {
    console.error("❌ Error fetching consultations with patient:", error);
    return res
      .status(500)
      .send("Error fetching consultations and patient details");
  }
};
