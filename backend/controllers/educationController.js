const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}

exports.createEducation = async (req, res) => {
    
    const { degree, institution, year, description } = req.body;

      const sql = `INSERT INTO  education (degree, institution, year, description) VALUES (?,?,?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [degree, institution, year, description]);
    
        connection.end();

        return res.status(200).send("Education created successfully");

      } catch (err) {
        console.error("Error during creating education:", err);
      }
}

exports.getEducation = async(req,res) => {

  const sql = `SELECT * FROM education`; 

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Education not found");
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error("Error fetching Education details:", error);
    res.status(500).send("Error fetching Education details");
  }
}


exports.updateEducation = async(req, res) => {

  const {id, degree, institution, year, description } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `UPDATE education  SET degree = ?, institution = ?, year = ?, description = ? where id = ? `;
        const result = await connection.query(query,[degree, institution, year, description, id]);

        connection.end();

        return res.status(200).send("Education updated successfully");
        
    }catch(error){
        console.error("Education update error: ", error);
        return res.status(500).send("Education update error");
  }
}

exports.deleteEducation = async(req, res) => {

  const {id } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `DELETE from education  where id = ? `;
        const result = await connection.query(query,[id]);

        connection.end();

        return res.status(200).send("Education deleted successfully");
        
    }catch(error){
        console.error("Education delete error: ", error);
        return res.status(500).send("Education delete error");
  }
}

