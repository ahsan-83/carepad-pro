const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}

exports.createSocialPost = async (req, res) => {
    
    const { postURL } = req.body;

      const sql = `INSERT INTO  facebook_post (postURL) VALUES (?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [postURL]);
    
        connection.end();

        return res.status(200).send("Social Post created successfully");

      } catch (err) {
        console.error("Error during creating Social Post:", err);
      }
}

exports.getSocialPost = async(req,res) => {

  const sql = `SELECT * FROM facebook_post`; 

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Social Post not found");
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error("Error fetching Social Post details:", error);
    res.status(500).send("Error fetching Social Post details");
  }
}


exports.updateSocialPost = async(req, res) => {

  const {id, postURL } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `UPDATE facebook_post  SET postURL = ? where id = ? `;
        const result = await connection.query(query,[postURL, id]);

        connection.end();

        return res.status(200).send("Social Post updated successfully");
        
    }catch(error){
        console.error("Social Post update error: ", error);
        return res.status(500).send("Social Post update error");
  }
}

exports.deleteSocialPost = async(req, res) => {

  const {id } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `DELETE from facebook_post  where id = ? `;
        const result = await connection.query(query,[id]);

        connection.end();

        return res.status(200).send("Social Post deleted successfully");
        
    }catch(error){
        console.error("Social Post delete error: ", error);
        return res.status(500).send("Social Post delete error");
  }
}

