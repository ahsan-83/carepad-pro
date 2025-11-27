const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}

exports.createProfile = async (req, res) => {
    
    const { name, mobile, bmdc, email, specialty, experience, department, hospital, shortBio, about } = req.body;

      const sql = `
        INSERT INTO  profile_info (name, mobile, bmdc, email, specialty, experience, department, hospital, shortBio, about) 
        VALUES (?,?,?,?,?,?,?,?,?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [name, mobile, bmdc, email, specialty, experience, department, hospital, shortBio, about]);
    
        connection.end();

        return res.status(200).send("Profile created successfully");

      } catch (err) {
        console.error("Error during creating profile:", err);
      }
}

exports.getProfile = async(req,res) => {

  const sql = `SELECT * FROM profile_info`; 

  try {
    const connection = await await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Profile not found");
    } else {
      res.json(results[0]);
    }
  } catch (error) {
    console.error("Error fetching profile details:", error);
    res.status(500).send("Error fetching profile details");
  }
}


exports.updateProfile = async(req, res) => {

  const {name, mobile, bmdc, email, specialty, experience, department, hospital, shortBio, about } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `UPDATE profile_info  SET name = ?, mobile = ?, bmdc = ?, email = ?, specialty = ?, experience = ?, department = ?, hospital = ?, shortBio = ?, about = ? `;
        const result = await connection.query(query,[name, mobile, bmdc, email, specialty, experience, department, hospital, shortBio, about]);

        connection.end();

        return res.status(200).send("Profile updated successfully");
        
    }catch(error){
        console.error("Profile update error: ", error);
        return res.status(500).send("Profile update error");
  }
}

exports.createProfileImage = async (req, res) => {
    
     const { mimetype, data } = req.body;

     const buffer = Buffer.from(data, 'base64');

      const sql = `INSERT INTO  profile_image (image, mimetype) VALUES (?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [buffer, mimetype]);
    
        connection.end();

        return res.status(200).send("Image created successfully");

      } catch (err) {
        console.error("Error during creating Image:", err);
      }
}

exports.getProfileImage = async(req,res) => {

  const sql = `SELECT * FROM profile_image`; 

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Image not found");
    } else {
    const images = results.map(img => ({
        id: img.id,
        mimetype: img.mimetype,
        data: `data:${img.mimetype};base64,${img.image.toString('base64')}`
    }));

    res.json(images);
    }
  } catch (error) {
    console.error("Error fetching Image details:", error);
    res.status(500).send("Error fetching Image details");
  }
}


exports.deleteProfileImage = async(req, res) => {

  const {id } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `DELETE from profile_image  where id = ? `;
        const result = await connection.query(query,[id]);

        connection.end();

        return res.status(200).send("Image deleted successfully");
        
    }catch(error){
        console.error("Image delete error: ", error);
        return res.status(500).send("Image delete error");
  }
}