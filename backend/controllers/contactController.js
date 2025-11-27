const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}

exports.createContact = async (req, res) => {
    
    const { phone, email, address, day_time, googleURL, facebookURL, twitterURL, linkedinURL } = req.body;

      const sql = `
        INSERT INTO  contact (phone, email, address, day_time, googleURL, facebookURL, twitterURL, linkedinURL) 
        VALUES (?,?,?,?,?,?,?,?)`;
    
      try {
        const connection = await createCustomConnection(req);

        await connection.query(sql, [phone, email, address, day_time, googleURL, facebookURL, twitterURL, linkedinURL]);
    
        connection.end();

        return res.status(200).send("Contact created successfully");

      } catch (err) {
        console.error("Error during creating Contact:", err);
      }
}

exports.getContact = async(req,res) => {

  const sql = `SELECT * FROM contact`; 

  try {
    const connection = await createCustomConnection(req);
    const [results] = await connection.query(sql);

    connection.end();

    if (results.length === 0) {
      res.status(404).send("Contact not found");
    } else {
      res.json(results[0]);
    }
  } catch (error) {
    console.error("Error fetching Contact details:", error);
    res.status(500).send("Error fetching Contact details");
  }
}


exports.updateContact = async(req, res) => {

  const {phone, email, address, day_time, googleURL, facebookURL, twitterURL, linkedinURL } = req.body;

  try{

        const connection = await createCustomConnection(req);
        const query = `UPDATE contact  SET phone = ?, email = ?, address = ?, day_time = ?, googleURL = ?, facebookURL = ?, twitterURL = ?, linkedinURL = ? `;
        const result = await connection.query(query,[phone, email, address, day_time, googleURL, facebookURL, twitterURL, linkedinURL]);

        connection.end();

        return res.status(200).send("Contact updated successfully");
        
    }catch(error){
        console.error("Contact update error: ", error);
        return res.status(500).send("Contact update error");
  }
}

