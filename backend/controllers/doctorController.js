const { initializeConnection, customConnection } = require("../config/database");

async function createCustomConnection(req){

    const db_host = req.headers["db_host"];
    const db_user = req.headers["db_user"];
    const db_password = req.headers["db_password"];
    const db_name = req.headers["db_name"];

    return await customConnection(db_host,db_user,db_password,db_name);
}


exports.getDoctorProfile = async (req, res) => {
  const bmdc = req.headers["bmdc"];

  try {
    const connection = await initializeConnection();
    const query = "SELECT * FROM doctors WHERE bmdc = ?";
    const result = await connection.query(query, [bmdc]);

    if (result[0].length === 0) {
      connection.end();
      return res.status(403).send("Forbidden request");
    }

    connection.end();

    const customDBConnection = await createCustomConnection(req);

    const doctor = result[0];

    const [degreeRows] = await customDBConnection.query(
      `SELECT degreeName AS degree, institution, year 
       FROM doctor_degrees WHERE doctor_id = ?`,
      [doctor.id]
    );

    customDBConnection.end();

    // ✅ combine results
    res.json({
      ...doctor,
      degrees: degreeRows || [],
    });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    res.status(500).send("Error fetching doctor profile");
  }
};

exports.updateDoctorProfile = async (req, res) => {
  const { name, email, imageURL, specialty, address, phone, degrees } = req.body;

  const bmdc = req.headers["bmdc"];

  try {
    const connection = await initializeConnection();

    // 🔒 Verify doctor
    const [verifyResult] = await connection.query(
      "SELECT id FROM doctors WHERE bmdc = ?",
      [bmdc]
    );

    if (verifyResult.length === 0) {
      connection.end();
      return res.status(403).send("Forbidden request");
    }

    connection.end();

    const doctorId = verifyResult[0].id;

    // ✅ Update doctor basic info
    const sql = `
      UPDATE doctors 
      SET name = ?, email = ?, imageURL = ?, specialty = ?, address = ?, phone = ? 
      WHERE id = ?
    `;
    await connection.query(sql, [
      name,
      email,
      imageURL,
      specialty,
      address,
      phone,
      doctorId,
    ]);

    const customDBConnection = await createCustomConnection(req);

    // ✅ Update doctor degrees
    if (Array.isArray(degrees)) {
      // First delete existing degrees
      await customDBConnection.query("DELETE FROM doctor_degrees WHERE doctor_id = ?", [
        doctorId,
      ]);

      // Insert new ones
      for (const degree of degrees) {
        if (degree.degree || degree.institution || degree.year) {
          await customDBConnection.query(
            "INSERT INTO doctor_degrees (doctor_id, degreeName, institution, year) VALUES (?, ?, ?, ?)",
            [
              doctorId,
              degree.degree || "",
              degree.institution || "",
              degree.year || "",
            ]
          );
        }
      }
    }

    customDBConnection.end();

    res.status(200).send("Doctor Profile Updated Successfully");
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(500).send("Error updating doctor profile");
  }
};

exports.addDoctorConsultations = async (req, res) => {
  const bmdc = req.headers["bmdc"];

  const payload = req.body; 

  try {
    const connection = await initializeConnection();

    // 🔒 Verify doctor
    const [verifyResult] = await connection.query(
      "SELECT id FROM doctors WHERE bmdc = ?",
      [bmdc]
    );

    if (verifyResult.length === 0) {
      connection.end();
      return res.status(403).send("Forbidden request");
    }

    const doctorId = verifyResult[0].id;

    connection.end();

    const customDBConnection = await createCustomConnection(req);

    // ✅ Start transaction
    await customDBConnection.beginTransaction();

    // Step 1: Insert into consultation_locations
    const [locationResult] = await customDBConnection.query(
      `INSERT INTO consultation_locations 
        (doctor_id, locationName, address, locationType, roomNumber, consultationFee) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        doctorId,
        payload.locationName,
        payload.address,
        payload.locationType,
        payload.roomNumber || null,
        payload.consultationFee,
      ]
    );

    const locationId = locationResult.insertId;

    // Step 2: Insert into active_days
    for (const dayObj of payload.activeDays) {
      const [activeDayResult] = await customDBConnection.query(
        `INSERT INTO active_days (location_id, day, isActive) 
         VALUES (?, ?, ?)`,
        [locationId, dayObj.day, dayObj.isActive ? 1 : 0]
      );

      const activeDayId = activeDayResult.insertId;

      // Step 3: Insert time slots if any
      for (const slot of dayObj.timeSlots || []) {
        await customDBConnection.query(
          `INSERT INTO time_slots 
            (active_day_id, slotActive, startTime, endTime, slotDuration, capacity) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            activeDayId,
            slot.slotActive ? 1 : 0,
            slot.startTime,
            slot.endTime,
            slot.slotDuration,
            slot.capacity,
          ]
        );
      }
    }

    // ✅ Commit transaction
    await customDBConnection.commit();
    customDBConnection.end();

    res.status(200).send("Consultation Locations Updated Successfully");
  } catch (error) {
    console.error("Error updating consultations:", error);
    if (connection) await connection.rollback();
    res.status(500).send("Error updating consultations");
  }
};

exports.getConsultationLocations = async (req, res) => {
  const bmdc = req.headers["bmdc"]; 

  const { consultLocation, activeDay, startTime, endTime, search } = req.query;

  try {
    const connection = await initializeConnection();

    // 🔹 Find doctor by BMDC only
    const [verifyResult] = await connection.query(
      "SELECT id FROM doctors WHERE bmdc = ?",
      [bmdc]
    );

    if (verifyResult.length === 0) {
      connection.end();
      return res.status(404).send("Doctor not found");
    }

    connection.end();

    const customDBConnection = await createCustomConnection(req);

    const doctorId = verifyResult[0].id;

    // ✅ Base query for locations
    let query = "SELECT * FROM consultation_locations WHERE doctor_id = ?";
    const params = [doctorId];

    if (consultLocation && consultLocation !== "None") {
      query += " AND locationName = ?";
      params.push(consultLocation);
    }

    if (search && search.trim() !== "") {
      query += " AND (locationName LIKE ? OR address LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    const [locations] = await customDBConnection.query(query, params);

    const finalLocations = [];

    // ✅ Fetch activeDays + slots per location
    for (let loc of locations) {
      let dayQuery =
        "SELECT * FROM active_days WHERE location_id = ? AND isActive = 1";
      const dayParams = [loc.id];

      if (activeDay && activeDay !== "None") {
        dayQuery += " AND day = ?";
        dayParams.push(activeDay);
      }

      const [days] = await customDBConnection.query(dayQuery, dayParams);

      const validDays = [];

      for (let day of days) {
        let slotQuery = "SELECT * FROM time_slots WHERE active_day_id = ?";
        const slotParams = [day.id];

        if (
          startTime &&
          startTime !== "None" &&
          endTime &&
          endTime !== "None"
        ) {
          slotQuery += " AND startTime >= ? AND endTime <= ?";
          slotParams.push(startTime, endTime);
        } else if (startTime && startTime !== "None") {
          slotQuery += " AND startTime >= ?";
          slotParams.push(startTime);
        } else if (endTime && endTime !== "None") {
          slotQuery += " AND endTime <= ?";
          slotParams.push(endTime);
        }

        const [slots] = await customDBConnection.query(slotQuery, slotParams);

        // ✅ keep only days with slots
        if (slots.length > 0) {
          day.timeSlots = slots;
          validDays.push(day);
        }
      }

      loc.activeDays = validDays;

      // ✅ keep only locations with at least one valid day
      if (loc.activeDays.length > 0) {
        finalLocations.push(loc);
      }
    }

    customDBConnection.end();
    res.json(finalLocations);
  } catch (error) {
    console.error("Error fetching consultations:", error);
    res.status(500).send("Error fetching consultations");
  }
};

exports.togglePublishLocation = async (req, res) => {
  const bmdc = req.headers["bmdc"];

  const { locationId, publish } = req.body;

  try {
    const connection = await initializeConnection();

    // Verify doctor
    const [verifyResult] = await connection.query(
      "SELECT id FROM doctors  WHERE bmdc = ?",
      [bmdc]
    );
    if (verifyResult.length === 0) {
      connection.end();
      return res.status(403).send("Forbidden request");
    }

    connection.end();

    const customDBConnection = await createCustomConnection(req);

    const doctorId = verifyResult[0].id;

    // Update publish status
    await customDBConnection.query(
      "UPDATE consultation_locations SET isPublished = ? WHERE id = ? AND doctor_id = ?",
      [publish ? 1 : 0, locationId, doctorId]
    );

    customDBConnection.end();
    res.json({
      success: true,
      message: `Location ${publish ? "published" : "unpublished"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling publish status:", error);
    res.status(500).send("Error updating publish status");
  }
};


exports.updateConsultationLocation = async (req, res) => {
  const locationId = req.params.id;
  const {
    locationName,
    address,
    locationType,
    roomNumber,
    consultationFee,
    activeDays,
  } = req.body;

  const bmdc = req.headers["bmdc"];

  try {
    const connection = await initializeConnection();

    // Verify doctor
    const [verifyResult] = await connection.query(
      "SELECT id FROM doctors WHERE bmdc = ?",
      [bmdc]
    );

    if (verifyResult.length === 0) {
      connection.end();
      return res.status(403).send("Forbidden request");
    }

    const doctorId = verifyResult[0].id;

    connection.end();

    const customDBConnection = await createCustomConnection(req);

    // Update main location info
    await connection.query(
      `UPDATE consultation_locations 
       SET locationName=?, address=?, locationType=?, roomNumber=?, consultationFee=? 
       WHERE id=? AND doctor_id=?`,
      [
        locationName,
        address,
        locationType,
        roomNumber,
        consultationFee,
        locationId,
        doctorId,
      ]
    );

    // Delete old active days + slots
    const [existingDays] = await customDBConnection.query(
      "SELECT id FROM active_days WHERE location_id=?",
      [locationId]
    );

    for (const day of existingDays) {
      await customDBConnection.query("DELETE FROM time_slots WHERE active_day_id=?", [
        day.id,
      ]);
    }

    await customDBConnection.query("DELETE FROM active_days WHERE location_id=?", [
      locationId,
    ]);

    // Re-insert activeDays + timeSlots
    for (const day of activeDays) {
      const [dayResult] = await customDBConnection.query(
        "INSERT INTO active_days (location_id, day, isActive) VALUES (?, ?, ?)",
        [locationId, day.day, day.isActive ? 1 : 0]
      );

      const dayId = dayResult.insertId;

      for (const slot of day.timeSlots || []) {
        await customDBConnection.query(
          `INSERT INTO time_slots 
           (active_day_id, slotActive, startTime, endTime, slotDuration, capacity) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            dayId,
            slot.slotActive ? 1 : 0,
            slot.startTime,
            slot.endTime,
            slot.slotDuration,
            slot.capacity,
          ]
        );
      }
    }

    customDBConnection.end();
    res.status(200).send("Consultation location updated successfully");
  } catch (error) {
    console.error("Error updating consultation location:", error);
    res.status(500).send("Error updating consultation location");
  }
};

exports.deleteConsultationLocation = async (req, res) => {
  const locationId = req.params.id;
  const bmdc = req.headers["bmdc"];

  try {
    const connection = await initializeConnection();

    // Verify doctor
    const [verifyResult] = await connection.query(
      "SELECT id FROM doctors WHERE bmdc = ?",
      [bmdc]
    );

    if (verifyResult.length === 0) {
      connection.end();
      return res.status(403).send("Forbidden request");
    }

    connection.end();

    const customDBConnection = await createCustomConnection(req);

    const doctorId = verifyResult[0].id;

    // Step 1: Get active day ids
    const [days] = await customDBConnection.query(
      "SELECT id FROM active_days WHERE location_id=?",
      [locationId]
    );

    // Step 2: Delete all time slots
    for (const day of days) {
      await customDBConnection.query("DELETE FROM time_slots WHERE active_day_id = ?", [
        day.id,
      ]);
    }

    // Step 3: Delete active days
    await customDBConnection.query("DELETE FROM active_days WHERE location_id = ?", [
      locationId,
    ]);

    // Step 4: Delete main location (only if belongs to doctor)
    await customDBConnection.query(
      "DELETE FROM consultation_locations WHERE id=? AND doctor_id = ?",
      [locationId, doctorId]
    );

    customDBConnection.end();

    res.status(200).send("Consultation location deleted successfully");
  } catch (error) {
    console.error("Error deleting consultation location:", error);
    res.status(500).send("Error deleting consultation location");
  }
};
