const { initializeConnection } = require("../config/database");
const { OpenAI } = require("openai");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}

exports.getCounts = async (req, res) => {
  const bmdc = req.headers["bmdc"];

  const patient_db = "patient_" + bmdc;
  const consultation_db = "consultation_" + bmdc;

  const patient_sql = `SELECT COUNT(*) AS totalPatients FROM \`${patient_db}\` `;
  const appointment_sql = `SELECT COUNT(*) AS totalAppointments FROM \`${consultation_db}\` WHERE appointmentStatus = 'completed'`;
  const consultationfee_sql = `SELECT SUM(consultationFee) AS totalFees FROM \`${consultation_db}\` WHERE appointmentStatus <> 'completed'`;

  try {
    const connection = await createCustomConnection(req);

    const patientCount = await connection.query(patient_sql);
    const appointmentCount = await connection.query(appointment_sql);
    const feeCount = await connection.query(consultationfee_sql);

    connection.end();

    res.json({
      totalPatients: patientCount[0][0].totalPatients,
      totalAppointments: appointmentCount[0][0].totalAppointments,
      totalConsultationFee: feeCount[0][0].totalFees,
    });
  } catch (err) {
    if(connection) connection.end();
    console.error("Error during counting patient and consultation:", error);
    res.status(500).send("Error during counting patient and consultation");
  }
};

exports.getConsultationPerMonth = async (req, res) => {
  const { consultlocation, consultType, disease, year } = req.body;
  const bmdc = req.headers["bmdc"];

  const consultation_db = "consultation_" + bmdc;

  let sql = `SELECT DATE_FORMAT(date, '%b') AS Month,  COUNT(*) AS ConsultationCount, SUM(consultationFee) AS TotalFees FROM \`${consultation_db}\` 
                WHERE YEAR(date) = ? AND appointmentStatus = 'completed' `;

  let data = [year];
  if (consultlocation !== "None") {
    sql = sql + "AND consultlocation = ? ";
    data.push(consultlocation);
  } else {
    sql = sql + "AND consultlocation IS NOT NULL ";
  }

  if (consultType !== "None") {
    sql = sql + "AND consultType = ? ";
    data.push(consultType);
  } else {
    sql = sql + "AND consultType IS NOT NULL ";
  }

  if (disease !== "None") {
    sql = sql + "AND disease = ? ";
    data.push(disease);
  }

  sql = sql + `GROUP BY MONTH(date) ORDER BY Month DESC`;

  try {
    const connection = await createCustomConnection(req);

    const consultationPerMonth = await connection.query(sql, data);

    connection.end();

    res.json(consultationPerMonth[0]);
  } catch (err) {
    if(connection) connection.end();
    console.error("Error during counting consultation per month:", error);
    res.status(500).send("Error during counting consultation per month");
  }
};

exports.getPatientPerMonth = async (req, res) => {
  const { disease, treatmentStatus, age, sex, year } = req.body;
  const bmdc = req.headers["bmdc"];

  const patient_db = "patient_" + bmdc;

  let sql = `SELECT DATE_FORMAT(registrationDate, '%b') AS Month,  COUNT(*) AS PatientCount FROM \`${patient_db}\` 
                WHERE YEAR(registrationDate) = ? `;

  let data = [year];
  if (treatmentStatus !== "None") {
    sql = sql + "AND treatmentStatus = ? ";
    data.push(treatmentStatus);
  } else {
    sql = sql + "AND treatmentStatus IS NOT NULL ";
  }

  if (age && age > 0) {
    sql = sql + "AND age = ? ";
    data.push(age);
  } else {
    sql = sql + "AND age IS NOT NULL ";
  }

  if (sex !== "None") {
    sql = sql + "AND sex = ? ";
    data.push(sex);
  } else {
    sql = sql + "AND sex IS NOT NULL ";
  }

  if (disease !== "None") {
    sql = sql + "AND disease = ? ";
    data.push(disease);
  }

  sql = sql + `GROUP BY MONTH(registrationDate) ORDER BY Month DESC`;

  try {
    const connection = await createCustomConnection(req);
    const patientPerMonth = await connection.query(sql, data);

    connection.end();

    res.json(patientPerMonth[0]);
  } catch (err) {
    if(connection) connection.end();
    console.error("Error during counting patient per month:", err);
    res.status(500).send("Error during counting patient per month");
  }
};

