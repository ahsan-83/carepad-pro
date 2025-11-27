const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}

exports.createAward = async (req, res) => {
    
    const { name, institution, year, reason } = req.body;

      const sql = `INSERT INTO  award (name, institution, year, reason) VALUES (?,?,?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [name, institution, year, reason]);
    
        connection.end();

        return res.status(200).send("Award created successfully");

      } catch (err) {
        console.error("Error during creating Award:", err);
      }
}

exports.getAward = async(req,res) => {

  const sql = `SELECT * FROM award`; 

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Award not found");
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error("Error fetching Award details:", error);
    res.status(500).send("Error fetching Award details");
  }
}


exports.updateAward = async(req, res) => {

  const {id, name, institution, year, reason } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `UPDATE award  SET name = ?, institution = ?, year = ?, reason = ? where id = ? `;
        const result = await connection.query(query,[name, institution, year, reason, id]);

        connection.end();

        return res.status(200).send("Award updated successfully");
        
    }catch(error){
        console.error("Award update error: ", error);
        return res.status(500).send("Award update error");
  }
}

exports.deleteAward = async(req, res) => {

  const {id } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `DELETE from award  where id = ? `;
        const result = await connection.query(query,[id]);

        connection.end();

        return res.status(200).send("Award deleted successfully");
        
    }catch(error){
        console.error("Award delete error: ", error);
        return res.status(500).send("Award delete error");
  }
}

