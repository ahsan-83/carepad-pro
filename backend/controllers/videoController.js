const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}

exports.createVideo = async (req, res) => {
    
    const { title, videoURL } = req.body;

      const sql = `INSERT INTO  video (title, videoURL) VALUES (?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [title, videoURL]);
    
        connection.end();

        return res.status(200).send("Video created successfully");

      } catch (err) {
        console.error("Error during creating Video:", err);
      }
}

exports.getVideo = async(req,res) => {

  const sql = `SELECT * FROM video`; 

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Video not found");
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error("Error fetching Video details:", error);
    res.status(500).send("Error fetching Video details");
  }
}


exports.updateVideo = async(req, res) => {

  const {id, title, videoURL } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `UPDATE video  SET title = ?, videoURL = ? where id = ? `;
        const result = await connection.query(query,[title, videoURL, id]);

        connection.end();

        return res.status(200).send("Video updated successfully");
        
    }catch(error){
        console.error("Video update error: ", error);
        return res.status(500).send("Video update error");
  }
}

exports.deleteVideo = async(req, res) => {

  const {id } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `DELETE from video  where id = ? `;
        const result = await connection.query(query,[id]);

        connection.end();

        return res.status(200).send("Video deleted successfully");
        
    }catch(error){
        console.error("Video delete error: ", error);
        return res.status(500).send("Video delete error");
  }
}

