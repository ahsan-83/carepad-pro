const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}

exports.createMembership = async (req, res) => {
    
    const { name, institution, year, description } = req.body;

      const sql = `INSERT INTO  membership (name, institution, year, description) VALUES (?,?,?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [name, institution, year, description]);
    
        connection.end();

        return res.status(200).send("Membership created successfully");

      } catch (err) {
        console.error("Error during creating Membership:", err);
      }
}

exports.getMembership = async(req,res) => {

  const sql = `SELECT * FROM membership`; 

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Membership not found");
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error("Error fetching Membership details:", error);
    res.status(500).send("Error fetching Membership details");
  }
}


exports.updateMembership = async(req, res) => {

  const {id, name, institution, year, description } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `UPDATE membership  SET name = ?, institution = ?, year = ?, description = ? where id = ? `;
        const result = await connection.query(query,[name, institution, year, description, id]);

        connection.end();

        return res.status(200).send("Membership updated successfully");
        
    }catch(error){
        console.error("Membership update error: ", error);
        return res.status(500).send("Membership update error");
  }
}

exports.deleteMembership = async(req, res) => {

  const {id } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `DELETE from membership  where id = ? `;
        const result = await connection.query(query,[id]);

        connection.end();

        return res.status(200).send("Membership deleted successfully");
        
    }catch(error){
        console.error("Membership delete error: ", error);
        return res.status(500).send("Membership delete error");
  }
}

