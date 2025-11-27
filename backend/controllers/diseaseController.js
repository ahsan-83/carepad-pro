const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}


exports.createDisease = async (req, res) => {
    
    const { name, description, symptoms, treatment } = req.body;

      const sql = `INSERT INTO  disease (name, description, symptoms, treatment) VALUES (?,?,?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [name, description, symptoms, treatment]);
    
        connection.end();

        return res.status(200).send("Disease created successfully");

      } catch (err) {
        console.error("Error during creating Disease:", err);
      }
}

exports.getDisease = async(req,res) => {

  const sql = `SELECT * FROM disease`; 

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Disease not found");
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error("Error fetching Disease details:", error);
    res.status(500).send("Error fetching Disease details");
  }
}


exports.updateDisease = async(req, res) => {

  const {id, name, description, symptoms, treatment } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `UPDATE disease  SET name = ?, description = ?, symptoms = ?, treatment = ? where id = ? `;
        const result = await connection.query(query,[name, description, symptoms, treatment, id]);

        connection.end();

        return res.status(200).send("Disease updated successfully");
        
    }catch(error){
        console.error("Disease update error: ", error);
        return res.status(500).send("Disease update error");
  }
}

exports.deleteDisease = async(req, res) => {

  const {id } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `DELETE from disease  where id = ? `;
        const result = await connection.query(query,[id]);

        connection.end();

        return res.status(200).send("Disease deleted successfully");
        
    }catch(error){
        console.error("Disease delete error: ", error);
        return res.status(500).send("Disease delete error");
  }
}

