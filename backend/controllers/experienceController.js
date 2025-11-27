const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}

exports.createExperience = async (req, res) => {
    
    const { position, institution, year, description } = req.body;

      const sql = `INSERT INTO  experience (position, institution, year, description) VALUES (?,?,?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [position, institution, year, description]);
    
        connection.end();

        return res.status(200).send("Experience created successfully");

      } catch (err) {
        console.error("Error during creating experience:", err);
      }
}

exports.getExperience = async(req,res) => {

  const sql = `SELECT * FROM experience`; 

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Experience not found");
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error("Error fetching Experience details:", error);
    res.status(500).send("Error fetching Experience details");
  }
}


exports.updateExperience = async(req, res) => {

  const {id, position, institution, year, description } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `UPDATE experience  SET position = ?, institution = ?, year = ?, description = ? where id = ? `;
        const result = await connection.query(query,[position, institution, year, description, id]);

        connection.end();

        return res.status(200).send("Experience updated successfully");
        
    }catch(error){
        console.error("Experience update error: ", error);
        return res.status(500).send("Experience update error");
  }
}

exports.deleteExperience = async(req, res) => {

  const {id } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `DELETE from experience  where id = ? `;
        const result = await connection.query(query,[id]);

        connection.end();

        return res.status(200).send("Experience deleted successfully");
        
    }catch(error){
        console.error("Experience delete error: ", error);
        return res.status(500).send("Experience delete error");
  }
}

