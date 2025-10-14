const { initializeConnection } = require("../config/database");

exports.addPatient = async (req, res) => {
    
    const { name, imageURL, age, sex, address, height, weight, phone, email, bloodGroup, dob, consultlocation, treatmentStatus, registrationDate, recentAppointmentDate } = req.body;

    //const refreshHeader = req.headers["verification"];
    const bmdc = req.headers["bmdc"];
    //const refreshtoken = refreshHeader && refreshHeader.split(" ")[1];

    const patient_db = "patient_" +  bmdc;
    const disease = "Unknown";
    
      const sql = `
        INSERT INTO  \`${patient_db}\` (name, imageURL, age, sex, address, height, weight, phone, email, bloodGroup, dob, consultlocation, treatmentStatus, disease , registrationDate, recentAppointmentDate) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, ?, ?, ?)`;
    
      try {
        const connection = await initializeConnection();

        await connection.query(sql, [name, imageURL, age, sex, address, height, weight, phone, email, bloodGroup, dob, consultlocation, treatmentStatus, disease, registrationDate, recentAppointmentDate]);
    
        connection.end();

      } catch (err) {
        console.error("Error during adding patient:", err);
      }

     try{

        const connection = await initializeConnection();
        const query = `SELECT * FROM \`${patient_db}\` WHERE phone = ?`;
        const result = await connection.query(query,[phone]);

        connection.end();

        if(result[0].length > 0){
            return res.json(result[0]);
        }
        
    }catch(error){
        console.error("Error during checking phone:", error);
    }
}

exports.updateRecentAppointment  = async(req, res) => {

    const { patientId, recentAppointmentDate, bmdc} = req.body;
    const patient_db = "patient_" +  bmdc;
    const refreshHeader = req.headers["verification"];
    const refreshtoken = refreshHeader && refreshHeader.split(" ")[1];


    try{

        const connection = await initializeConnection();
        const query = 'SELECT * FROM doctors WHERE refreshtoken = ? AND bmdc = ?';
        const result = await connection.query(query,[refreshtoken, bmdc]);

        connection.end();

        if(result[0].length === 0){
            return res.status(430).send("Forbidden request");
        }
        
    }catch(error){
        console.error("Error during verification:", error);
        return res.status(500).send("Error during verification");
    }

    const sql = `UPDATE \`${patient_db}\`  SET recentAppointmentDate = ? WHERE id = ?`;
    try {
        const connection = await initializeConnection();

        await connection.query(sql, [recentAppointmentDate, patientId]);
    
        connection.end();

        res.status(201).send("Recent Appointment Date updated successfully");
      } catch (err) {
        console.error("Error during updating recent appointment date:", error);
        res.status(500).send("Error updating recent appointment date");
      }
}

exports.updatePatient = async(req, res) => {

  const {id, name, imageURL, age, sex, address, height, weight, phone, email, bloodGroup, dob, consultlocation, treatmentStatus, recentAppointmentDate, disease} = req.body;

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

  const patient_db = "patient_" +  bmdc;

  try{

        const connection = await initializeConnection();
        const query = `UPDATE \`${patient_db}\`  SET name = ?, age = ?, sex = ?, address = ?, height = ?, weight = ?, phone = ?, email = ?, bloodGroup = ?, dob = ?, consultlocation = ? WHERE id = ?`;
        const result = await connection.query(query,[name, age, sex, address, height, weight, phone, email, bloodGroup, dob, consultlocation,id]);

        connection.end();

        return res.status(200).send("Profile updated successfully");
        
    }catch(error){
        console.error("Profile update error: ", error);
        return res.status(500).send("Profile update error");
  }
}

exports.getPatientById = async(req,res) => {

  const {patientId} = req.body; 
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

  const patient_db = "patient_" +  bmdc;

  const sql = `SELECT * FROM \`${patient_db}\` WHERE id = ?`; 

  try {
    const connection = await initializeConnection();
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

}

exports.getPatients  = async(req, res) => {

    let { disease, sex, consultlocation, treatmentStatus, recentAppointmentDate} = req.body;

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
    
    const patient_db = "patient_" +  bmdc;

    let sql = `SELECT * FROM \`${patient_db}\` WHERE `;
    let data = []

    if(disease !== "None"){
      sql = sql + "disease = ? ";
      data.push(disease);
    }else{
      sql = sql + "disease IS NOT NULL ";
    }

    if(sex !== "None" ){
      sql = sql + "AND sex = ? ";
      data.push(sex);
    }else{
      sql = sql + "AND sex IS NOT NULL ";
    }

    if(consultlocation !=="None" ){
      sql = sql + "AND consultlocation = ? ";
      data.push(consultlocation);
    }else{
      sql = sql + "AND consultlocation IS NOT NULL ";
    }
    
    if(treatmentStatus !== "None"){
      sql = sql + "AND treatmentStatus = ? ";
      data.push(treatmentStatus);
    }else{
      sql = sql + "AND treatmentStatus IS NOT NULL ";
    }

    if(recentAppointmentDate !=="None"){
      sql = sql + "AND DATE(recentAppointmentDate) = ? ";
      data.push(recentAppointmentDate);
    }else{
      sql = sql + "AND recentAppointmentDate IS NOT NULL ";
    }


    try {

        const connection = await initializeConnection();
        const results = await connection.query(sql,data);
    
        connection.end();
        
        res.json(results[0]);
      } catch (err) {
        console.error("Error during getting patients", error);
        res.status(500).send("Error getting patients");
      }
}