const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}

exports.createLocation = async (req, res) => {
    
    const { name, address, contact, day_time, googleURL } = req.body;

      const sql = `INSERT INTO  consultation_location (name, address, contact, day_time, googleURL) VALUES (?,?,?,?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [name, address, contact, day_time, googleURL]);
    
        connection.end();

        return res.status(200).send("Location created successfully");

      } catch (err) {
        console.error("Error during creating Location:", err);
      }
}

exports.getLocation = async(req,res) => {

  const sql = `SELECT * FROM consultation_location`; 

  try {
    const connection = await createCustomConnection(req);

    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Location not found");
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error("Error fetching Location details:", error);
    res.status(500).send("Error fetching Location details");
  }
}


exports.updateLocation = async(req, res) => {

  const {id, name, address, contact, day_time, googleURL  } = req.body;

  try{

        const connection = await createCustomConnection(req);

        const query = `UPDATE consultation_location  SET name = ?, address = ?, contact = ?, day_time = ?, googleURL = ?  where id = ? `;
        const result = await connection.query(query,[name, address, contact, day_time, googleURL, id]);

        connection.end();

        return res.status(200).send("Location updated successfully");
        
    }catch(error){
        console.error("Location update error: ", error);
        return res.status(500).send("Location update error");
  }
}

exports.deleteLocation = async(req, res) => {

  const {id } = req.body;

  try{

        const connection = await createCustomConnection(req);

        const query = `DELETE from consultation_location  where id = ? `;
        const result = await connection.query(query,[id]);

        connection.end();

        return res.status(200).send("Location deleted successfully");
        
    }catch(error){
        console.error("Location delete error: ", error);
        return res.status(500).send("Location delete error");
  }
}

