const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}

exports.createCertificate = async (req, res) => {
    
    const { name, provider, year } = req.body;

      const sql = `INSERT INTO  certificate (name, provider, year) VALUES (?,?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [name, provider, year]);
    
        connection.end();

        return res.status(200).send("Certificate created successfully");

      } catch (err) {
        console.error("Error during creating Certificate:", err);
      }
}

exports.getCertificate = async(req,res) => {

  const sql = `SELECT * FROM certificate`; 

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Certificate not found");
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error("Error fetching Certificate details:", error);
    res.status(500).send("Error fetching Certificate details");
  }
}


exports.updateCertificate = async(req, res) => {

  const {id, name, provider, year } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `UPDATE certificate  SET name = ?, provider = ?, year = ? where id = ? `;
        const result = await connection.query(query,[name, provider, year, id]);

        connection.end();

        return res.status(200).send("Certificate updated successfully");
        
    }catch(error){
        console.error("Certificate update error: ", error);
        return res.status(500).send("Certificate update error");
  }
}

exports.deleteCertificate = async(req, res) => {

  const {id } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `DELETE from certificate  where id = ? `;
        const result = await connection.query(query,[id]);

        connection.end();

        return res.status(200).send("Certificate deleted successfully");
        
    }catch(error){
        console.error("Certificate delete error: ", error);
        return res.status(500).send("Certificate delete error");
  }
}

