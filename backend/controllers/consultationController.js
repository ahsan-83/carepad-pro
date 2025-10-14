const { initializeConnection } = require("../config/database");

exports.addConsultation = async (req, res) => {
    
    const { patientId, consultlocation, consultType, dateTime, patientCondition, consultationFee, appointmentStatus } = req.body;

    const bmdc = req.headers["bmdc"];

    const consultation_db = "consultation_" +  bmdc;

      const sql = `
        INSERT INTO  \`${consultation_db}\` (patientId, consultlocation, consultType, dateTime, patientCondition, consultationFee, appointmentStatus) 
        VALUES (?,?,?,?,?,?,?)`;
    
      try {
        const connection = await initializeConnection();

        await connection.query(sql, [patientId, consultlocation, consultType, dateTime, patientCondition, consultationFee, appointmentStatus]);
    
        connection.end();

        res.status(201).send("Consultation added successfully");
      } catch (err) {
        console.error("Error during adding consultation:", error);
        res.status(500).send("Error adding consultation");
      }
}

exports.cancelAppointment = async (req, res) =>{

    let {  appointmentId } = req.body;

    const refreshHeader = req.headers["verification"];
    const bmdc = req.headers["bmdc"];
    const refreshtoken = refreshHeader && refreshHeader.split(" ")[1];

    try{

        const connection = await initializeConnection();
        const query = 'SELECT * FROM doctors WHERE refreshtoken = ? AND bmdc = ?';
        const result = await connection.query(query,[refreshtoken, bmdc]);

        connection.end();

        if(result[0].length === 0){
            return res.status(403).send("Forbidden request");
        }
        
    }catch(error){
        console.error("Error during verification:", error);
        return res.status(500).send("Error during verification");
    }

    const consultation_db = "consultation_" +  bmdc;

    let sql = `UPDATE  \`${consultation_db}\` SET appointmentStatus = 'Cancelled' WHERE id = ?`;

    try {
      const connection = await initializeConnection();

      const results = await connection.query(sql,[appointmentId]);
  
      connection.end();

      res.status(200).send("Appointment Cancelled Successfully");
    } catch (err) {
      console.error("Error cancelling appointment ", error);
      res.status(500).send("Error cancelling appointment");
    }

}

exports.updateConsultation = async (req, res) =>{

    let {  id,
      patientId,
      patientCondition,
      appointmentStatus,
      audioURL,
      medicalTests,
      medicalReports,
      medicalFiles,
      reportComments,
      patientAdvice,
      medicine,
      doctorNotes,
      recoveryStatus,
      disease,
      followUp, 
      consulationDate } = req.body;

    const refreshHeader = req.headers["verification"];
    const bmdc = req.headers["bmdc"];
    const refreshtoken = refreshHeader && refreshHeader.split(" ")[1];

    try{

        const connection = await initializeConnection();
        const query = 'SELECT * FROM doctors WHERE refreshtoken = ? AND bmdc = ?';
        const result = await connection.query(query,[refreshtoken, bmdc]);

        connection.end();

        if(result[0].length === 0){
            return res.status(403).send("Forbidden request");
        }
        
    }catch(error){
        console.error("Error during verification:", error);
        return res.status(500).send("Error during verification");
    }

    const consultation_db = "consultation_" +  bmdc;
    const patient_db = "patient_" +  bmdc;

    let consultation_sql = `UPDATE  \`${consultation_db}\` SET patientCondition = ?, appointmentStatus = ?, audioURL = ?, medicalTests = ?, medicalReports = ?, medicalFiles = ?, reportComments = ?, patientAdvice = ?, medicine = ?, doctorNotes = ?, recoveryStatus = ?, disease = ?, followUp = ? WHERE id = ?`;
    let patient_sql = `UPDATE  \`${patient_db}\` SET recentAppointmentDate = ?, disease = ? WHERE id = ?`;

    try {
      const connection = await initializeConnection();

      await connection.query(consultation_sql,[patientCondition,appointmentStatus,audioURL,medicalTests,medicalReports,medicalFiles,reportComments,patientAdvice,medicine,doctorNotes,recoveryStatus,disease,followUp, id]);
  
      await connection.query(patient_sql, [consulationDate, disease, patientId]);

      connection.end();

      res.status(200).send("Consultation Updated Successfully");
    } catch (err) {
      console.error("Error updating consultation ", error);
      res.status(500).send("Error updating consultation");
    }

}


exports.getAppointments = async(req,res) => {

    let { consultlocation, consultType, dateTime, appointmentStatus } = req.body;
    const refreshHeader = req.headers["verification"];
    const bmdc = req.headers["bmdc"];
    const refreshtoken = refreshHeader && refreshHeader.split(" ")[1];

    try{

        const connection = await initializeConnection();
        const query = 'SELECT * FROM doctors WHERE refreshtoken = ? AND bmdc = ?';
        const result = await connection.query(query,[refreshtoken, bmdc]);

        connection.end();

        if(result[0].length === 0){
            return res.status(403).send("Forbidden request");
        }
        
    }catch(error){
        console.error("Error during verification:", error);
        return res.status(500).send("Error during verification");
    }

    const consultation_db = "consultation_" +  bmdc;
    const patient_db = "patient_" +  bmdc;

    let sql = `SELECT  b.name, b.age, b.sex, b.phone, b.email, b.height, b.weight, b.bloodGroup, b.dob, b.address, b.imageURL,  a.id, a.patientId, a.consultlocation, a.consultType, a.dateTime, a.appointmentStatus, a.patientCondition  FROM ( SELECT id, patientId, consultlocation, consultType, dateTime, appointmentStatus, patientCondition from \`${consultation_db}\` WHERE `;
    
    let data = []
    if(consultlocation !=="None"){
      sql = sql + "consultlocation = ? ";
      data.push(consultlocation);
    }else{
      sql = sql + "consultlocation IS NOT NULL ";
    }

    if(consultType !=="None"){
      sql = sql + "AND consultType = ? ";
      data.push(consultType);
    }else{
      sql = sql + "AND consultType IS NOT NULL ";
    }

    if(dateTime !=="None"){
      sql = sql + "AND DATE(dateTime) = ? ";
      data.push(dateTime);
    }else{
      sql = sql + "AND dateTime IS NOT NULL ";
    }
    
    if(appointmentStatus !=="None"){
      sql = sql + "AND appointmentStatus = ? ";
      data.push(appointmentStatus);
    }else{
      sql = sql + "AND appointmentStatus IS NOT NULL ";
    }

    sql = sql + ` ) AS a JOIN \`${patient_db}\` AS b ON a.patientId = b.id`;

    try {
      const connection = await initializeConnection();

      const results  = await connection.query(sql,data);
  
      connection.end();

      res.json(results[0]);
    } catch (err) {
      console.error("Error getting consultation:", error);
      res.status(500).send("Error getting consultation");
    }
}


exports.getNotes = async(req,res) => {

  let { disease, consultlocation, consultType, appointmentDate } = req.body;

  const refreshHeader = req.headers["verification"];
  const bmdc = req.headers["bmdc"];
  const refreshtoken = refreshHeader && refreshHeader.split(" ")[1];

  try{

      const connection = await initializeConnection();
      const query = 'SELECT * FROM doctors WHERE refreshtoken = ? AND bmdc = ?';
      const result = await connection.query(query,[refreshtoken, bmdc]);

      connection.end();

      if(result[0].length === 0){
          return res.status(403).send("Forbidden request");
      }
      
  }catch(error){
      console.error("Error during verification:", error);
      return res.status(500).send("Error during verification");
  }

  const consultation_db = "consultation_" +  bmdc;

  let sql = `SELECT id, consultlocation, consultType, dateTime, disease, doctorNotes from \`${consultation_db}\` WHERE `;
  
  let data = []
  if(consultlocation !=="None"){
    sql = sql + "consultlocation = ? ";
    data.push(consultlocation);
  }else{
    sql = sql + "consultlocation IS NOT NULL ";
  }

  if(consultType !=="None"){
    sql = sql + "AND consultType = ? ";
    data.push(consultType);
  }else{
    sql = sql + "AND consultType IS NOT NULL ";
  }

  if(appointmentDate !=="None"){
    sql = sql + "AND DATE(dateTime) = ? ";
    data.push(appointmentDate);
  }else{
    sql = sql + "AND dateTime IS NOT NULL ";
  }

  if(disease !=="None"){
    sql = sql + "AND disease = ? ";
    data.push(disease);
  }

    try {
      const connection = await initializeConnection();

      const results  = await connection.query(sql,data);
  
      connection.end();

      res.json(results[0]);
    } catch (err) {
      console.error("Error getting consultation notes:", error);
      res.status(500).send("Error getting consultation notes");
    }
}


exports.getAllConsultations = async(req,res) => {

    const { consultationId, patientId } = req.body;
    const refreshHeader = req.headers["verification"];
    const bmdc = req.headers["bmdc"];
    const refreshtoken = refreshHeader && refreshHeader.split(" ")[1];

    try{

        const connection = await initializeConnection();
        const query = 'SELECT * FROM doctors WHERE refreshtoken = ? AND bmdc = ?';
        const result = await connection.query(query,[refreshtoken, bmdc]);

        connection.end();

        if(result[0].length === 0){
            return res.status(403).send("Forbidden request");
        }
        
    }catch(error){
        console.error("Error during verification:", error);
        return res.status(500).send("Error during verification");
    }

    const consultation_db = "consultation_" +  bmdc;

    const sql = `SELECT  * from \`${consultation_db}\` WHERE patientId = ? AND id <> ?`;
  
    try {
      const connection = await initializeConnection();

      const results  = await connection.query(sql,[patientId, consultationId]);
  
      connection.end();

      res.json(results[0]);
    } catch (err) {
      console.error("Error getting all consultation:", error);
      res.status(500).send("Error getting all consultation");
    }
}


exports.getSingleConsultation = async(req,res) => {

    const { bmdc } = req.body;

    const refreshHeader = req.headers["verification"];
    const refreshtoken = refreshHeader && refreshHeader.split(" ")[1];

    try{

        const connection = await initializeConnection();
        const query = 'SELECT * FROM doctors WHERE refreshtoken = ? AND bmdc = ?';
        const result = await connection.query(query,[refreshtoken, bmdc]);

        connection.end();

        if(result[0].length === 0){
            return res.status(403).send("Forbidden request");
        }
        
    }catch(error){
        console.error("Error during verification:", error);
        return res.status(500).send("Error during verification");
    }
    
    const consultationId = req.params.id; 

    const consultation_db = "consultation_" +  bmdc;

    const sql = `SELECT  * from \`${consultation_db}\` WHERE id = ?`;
  
    try {
      const connection = await initializeConnection();

      const results  = await connection.query(sql,[consultationId]);
  
      connection.end();
      
      res.json(results[0]);
    } catch (err) {
      console.error("Error getting single consultation:", error);
      res.status(500).send("Error getting single consultation");
    }
}