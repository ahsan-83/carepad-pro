const { initializeConnection } = require("../config/database");

exports.getDoctorProfile = async (req, res) => {
  
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

  const sql = `SELECT name, email, imageURL, specialty, address, phone, affiliation, consultlocation  FROM doctors WHERE bmdc = ?`;     
  
  try {
    const connection = await initializeConnection();
    const [results] = await connection.query(sql, [bmdc]);

    connection.end();
    
    if (results.length === 0) {
      res.status(404).send("Doctor profile not found");
    } else {
      res.json(results[0]);
    }
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    res.status(500).send("Error fetching doctor profile");
  }
};


exports.updateDoctorProfile = async (req, res) => {
  
  const {name, email, imageURL, specialty, address, phone, affiliation, consultlocation} = req.body;

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

  const sql = `UPDATE doctors SET name= ?, email= ?, imageURL = ?, specialty = ?, address = ?, phone = ?, affiliation = ?, consultlocation = ? WHERE bmdc = ?`;     
  
  try {
    const connection = await initializeConnection();
    await connection.query(sql, [name, email, imageURL, specialty, address, phone, affiliation, consultlocation, bmdc]);

    connection.end();
    
    res.status(200).send("Doctor Profile Updated Successfully");
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(500).send("Error updating doctor profile");
  }
};