const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}


exports.createSpecialty = async (req, res) => {
    
    const { name, description } = req.body;

      const sql = `INSERT INTO  specialty (name, description) VALUES (?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [name, description]);
    
        connection.end();

        return res.status(200).send("Specialty created successfully");

      } catch (err) {
        console.error("Error during creating specialty:", err);
      }
}

exports.getSpecialty = async(req,res) => {

  const sql = `SELECT * FROM specialty`; 

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Specialty not found");
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error("Error fetching Specialty details:", error);
    res.status(500).send("Error fetching Specialty details");
  }
}


exports.updateSpecialty = async(req, res) => {

  const {id, name, description } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `UPDATE specialty  SET name = ?, description = ? where id = ? `;
        const result = await connection.query(query,[name, description, id]);

        connection.end();

        return res.status(200).send("Specialty updated successfully");
        
    }catch(error){
        console.error("Specialty update error: ", error);
        return res.status(500).send("Specialty update error");
  }
}

exports.deleteSpecialty = async(req, res) => {

  const {id } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `DELETE from specialty  where id = ? `;
        const result = await connection.query(query,[id]);

        connection.end();

        return res.status(200).send("Specialty deleted successfully");
        
    }catch(error){
        console.error("Specialty delete error: ", error);
        return res.status(500).send("Specialty delete error");
  }
}

