const express = require("express");
const router = express.Router();
const db = require("../dbSingleton").getConnection();
const nodemailer = require('nodemailer');

// Use App Password if present, fallback to PASS for legacy
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || "").replace(/\s/g, "")
    }
  });
}
router.get("/all-upcoming-classes", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "trainer") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const sql = `
    SELECT
      c.ClassID,
      c.Schedule,
      c.time,
      c.TrainerID,
      u.FirstName AS TrainerFirstName,
      u.LastName AS TrainerLastName,
      ct.type AS ClassTypeName,
      c.ClassType
    FROM classes c
    JOIN users u ON c.TrainerID = u.UserID
    JOIN class_types ct ON c.ClassType = ct.id
    WHERE c.Schedule >= CURDATE()
    ORDER BY c.Schedule ASC, c.time ASC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching all upcoming classes:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});
router.get("/all-upcoming-classes-with-count", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "trainer") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // DO NOT filter on TrainerID here!
  const sql = `
    SELECT
      c.ClassID,
      c.Schedule,
      c.time,
      c.TrainerID,
      u.FirstName AS TrainerFirstName,
      u.LastName AS TrainerLastName,
      ct.type AS ClassTypeName,
      c.ClassType,
      ct.MaxParticipants,
      IFNULL(b.bookedCount, 0) AS bookedCount
    FROM classes c
    JOIN users u ON c.TrainerID = u.UserID
    JOIN class_types ct ON c.ClassType = ct.id
    LEFT JOIN (
      SELECT ClassID, COUNT(*) AS bookedCount
      FROM members_classes
      GROUP BY ClassID
    ) b ON c.ClassID = b.ClassID
    WHERE c.Schedule >= CURDATE()
    ORDER BY c.Schedule ASC, c.time ASC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching all upcoming classes:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});
// Get all class types for dropdowns
router.get("/class-types", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "trainer") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  db.query("SELECT id, type FROM class_types", (err, rows) => {
    if (err) {
      console.error("Error fetching class types:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// GET all classes for this trainer
router.get("/classes", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "trainer") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const trainerId = user.UserID;
  const sql = `
  SELECT 
    c.ClassID, 
    c.ClassType, 
    ct.type AS ClassTypeName, 
    c.Schedule, 
    c.time
  FROM classes c
  JOIN class_types ct ON c.ClassType = ct.id
  WHERE c.TrainerID = ?
  ORDER BY c.Schedule DESC
`;

  db.query(sql, [trainerId], (err, results) => {
    if (err) {
      console.error("Error fetching classes:", err);
      return res.status(500).json({ error: "Database error" });
    }
    // Just return results directly, no mapping needed unless you want to rename/remove fields
    res.json(results);
  });
});
//Trainer gets all classes for adjusting the time logic in add class.
router.get("/classes/all", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "trainer") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sql = `
    SELECT 
      c.ClassID, 
      c.ClassType, 
      ct.type AS ClassTypeName, 
      c.Schedule, 
      c.time
    FROM classes c
    JOIN class_types ct ON c.ClassType = ct.id
    ORDER BY c.Schedule DESC
  `;

  db.query(sql, [], (err, results) => {
    if (err) {
      console.error("Error fetching all classes:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});


// CREATE a class
router.post("/create-class", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "trainer") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const trainerId = user.UserID;
  let { classTypeId, schedule, time } = req.body;

  if (!classTypeId || !schedule || !time) {
    return res.status(400).json({ error: "Missing class data" });
  }

  schedule = String(schedule).slice(0, 10);
  if (typeof classTypeId === "string") classTypeId = parseInt(classTypeId);

  // Step 1: Check if any class exists at the same date & time
  const conflictCheckQuery = `
    SELECT COUNT(*) AS count
    FROM classes
    WHERE Schedule = ? AND time = ?
  `;

  db.query(conflictCheckQuery, [schedule, time], (errCheck, rowsCheck) => {
    if (errCheck) {
      console.error("DB Error checking existing classes:", errCheck);
      return res.status(500).json({ error: "Database error" });
    }
    if (rowsCheck[0].count > 0) {
      return res.status(409).json({ error: "Another class already exists at this date and time." });
    }

    // Step 2: Fetch MaxParticipants for this class type
    db.query(
      "SELECT MaxParticipants FROM class_types WHERE id = ?",
      [classTypeId],
      (err, rows) => {
        if (err || !rows.length) {
          return res.status(400).json({ error: "Invalid class type" });
        }
        const maxParticipants = rows[0].MaxParticipants || 0;

        const query = `
          INSERT INTO classes (ClassType, TrainerID, Schedule, time)
          VALUES (?, ?, ?, ?)
        `;
        db.query(
          query,
          [classTypeId, trainerId, schedule, time],
          (err2, results) => {
            if (err2) {
              console.error("DB Insert Error:", err2);
              return res.status(500).json({ error: "Database error" });
            }
            res.status(200).json({ message: "Class created successfully", classId: results.insertId });
          }
        );
      }
    );
  });
});



// UPDATE a class (with email notifications)
// UPDATE a class (with smart email change reporting)
router.put("/class/:classId", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "trainer") return res.status(401).json({ error: "Unauthorized" });

  const trainerId = user.UserID;
  const classId = req.params.classId;
  let { classTypeId, schedule, time } = req.body;

  if (!classTypeId || !schedule || !time) return res.status(400).json({ error: "Missing class data" });

  schedule = String(schedule).slice(0, 10);

  db.query("SELECT * FROM classes WHERE ClassID = ? AND TrainerID = ?", [classId, trainerId], (err, classRows) => {
    if (err || !classRows.length) return res.status(404).json({ error: "Class not found or not yours" });
    const oldClass = classRows[0];
    const oldDate = oldClass.Schedule ? String(oldClass.Schedule).slice(0, 10) : "";
    const oldTime = oldClass.time ? oldClass.time.slice(0, 5) : "";
    const oldType = oldClass.ClassType;

    const dateChanged = oldDate !== schedule;
    const timeChanged = oldTime !== time;
    const typeChanged = String(oldType) !== String(classTypeId);

    if (!dateChanged && !timeChanged && !typeChanged) {
      return res.status(400).json({ error: "No changes detected" });
    }

    db.query("SELECT type FROM class_types WHERE id = ?", [classTypeId], (errType, rowsType) => {
      const classTypeName = rowsType && rowsType[0] ? rowsType[0].type : `TypeID ${classTypeId}`;
      db.query(
        "UPDATE classes SET ClassType = ?, Schedule = ?, time = ? WHERE ClassID = ? AND TrainerID = ?",
        [classTypeId, schedule, time, classId, trainerId],
        (err2, result) => {
          if (err2) {
            console.error("DB Update Error:", err2);
            return res.status(500).json({ error: "Database error" });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Class not found or not owned by trainer" });
          }

          db.query(
            `SELECT u.Email, u.FirstName, u.LastName 
              FROM members_classes mc
              JOIN users u ON mc.MemberID = u.UserID
              WHERE mc.ClassID = ?`,
            [classId],
            async (err3, members) => {
              if (!err3 && Array.isArray(members) && members.length) {
                const transporter = getTransporter();
                await Promise.all(members.map(async member => {
                  // Smart email message:
                  let message = `<h2>Hello ${member.FirstName} ${member.LastName},</h2>
                      <p>Your booked class has been <b>updated</b> by the trainer:</p>
                      <ul>`;
                  if (typeChanged) message += `<li><strong>New Class Type:</strong> ${classTypeName}</li>`;
                  if (dateChanged) message += `<li><strong>New Date:</strong> ${schedule}</li>`;
                  if (timeChanged) message += `<li><strong>New Time:</strong> ${time}</li>`;
                  message += `</ul>`;

                  // If only type changed
                  if (typeChanged && !dateChanged && !timeChanged) {
                    message += `<p>The date and time remain as before.</p>`;
                  }
                  // If only date changed
                  if (!typeChanged && dateChanged && !timeChanged) {
                    message += `<p>The class type and time remain as before.</p>`;
                  }
                  // If only time changed
                  if (!typeChanged && !dateChanged && timeChanged) {
                    message += `<p>The class type and date remain as before.</p>`;
                  }
                  message += `
                      <p>Please check your dashboard for the updated class info.</p>
                      <hr/>
                      <p>Refit Gym Team</p>
                    `;
                  const mailOptions = {
                    from: `"Refit Gym" <${process.env.GMAIL_USER}>`,
                    to: member.Email,
                    subject: 'Refit Gym: Class Updated',
                    html: message
                  };
                  try {
                    await transporter.sendMail(mailOptions);
                  } catch (emailErr) {
                    console.error(`[MAIL ERROR] Failed to send to: ${member.Email}`);
                    console.error('[MAIL ERROR] Details:', emailErr);
                    if (emailErr.response) {
                      console.error('[MAIL ERROR] SMTP Response:', emailErr.response);
                    }
                  }
                }));
              }
              res.json({ message: "Class updated and members notified." });
            }
          );
        }
      );
    });
  });
});

// CANCEL a class , send email to class members
router.delete('/class/:id', (req, res) => {
  const user = req.session.user;
  const classId = req.params.id;
  if (!user || user.Role !== "trainer") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  db.query(
    `SELECT mc.MemberID, u.Email, u.FirstName, u.LastName
      FROM members_classes mc
      JOIN users u ON mc.MemberID = u.UserID
      WHERE mc.ClassID = ?`,
    [classId],
    async (err, members) => {
      if (err) return res.status(500).json({ error: "Failed to get members" });

      db.query(
        `DELETE FROM classes WHERE ClassID = ? AND TrainerID = ?`,
        [classId, user.UserID],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: "Failed to delete class" });
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Class not found or not yours" });
          }
          db.query(
            `DELETE FROM members_classes WHERE ClassID = ?`,
            [classId],
            async (err3) => {
              if (err3) console.error("Failed to clean up members_classes", err3);
              await Promise.all(members.map(member => {
                db.query(
                  `UPDATE membership SET ClassAmount = ClassAmount + 1 WHERE UserID = ? ORDER BY EndDate DESC LIMIT 1`,
                  [member.MemberID],
                  (creditErr) => {
                    if (creditErr) console.error("Failed to credit class for", member.MemberID, creditErr);
                  }
                );
                const mailOptions = {
                  from: `"Refit Gym" <${process.env.GMAIL_USER}>`,
                  to: member.Email,
                  subject: 'Refit Gym: Class Cancelled',
                  html: `
                    <h2>Hello ${member.FirstName} ${member.LastName},</h2>
                    <p>We apologize, but your scheduled class has been <b>cancelled</b> by the trainer.</p>
                    <ul>
                      <li>You have received <b>1 free class</b> as compensation.</li>
                    </ul>
                    <p>Check your dashboard for other available classes.</p>
                    <hr/>
                    <p>Refit Gym Team</p>
                  `
                };
                const transporter = getTransporter();
                return transporter.sendMail(mailOptions).catch(emailErr => {
                  console.error("Email failed for", member.Email, emailErr);
                });
              }));
              res.json({ message: "Class deleted, members notified and credited." });
            }
          );
        }
      );
    }
  );
});

// GET all classes with their members for trainer
// routes/trainer.js (replace your /classes-with-members route with this)

router.get("/classes-with-members", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "trainer") {
    console.log("[AUTH ERROR] Unauthorized access attempt");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const trainerId = user.UserID;
  
  // 1. Fetch all classes for this trainer, including MaxParticipants
  const sqlClasses = `
    SELECT
      c.ClassID,
      c.ClassType,
      ct.type AS ClassTypeName,
      c.Schedule,
      c.time,
      ct.MaxParticipants,
      c.TrainerID
    FROM classes c
    JOIN class_types ct ON c.ClassType = ct.id
    WHERE c.TrainerID = ?
    ORDER BY c.Schedule DESC, c.time DESC
  `;

  db.query(sqlClasses, [trainerId], (err, classes) => {
    if (err) {
      console.error("[DB ERROR] Fetching classes failed:", err);
      return res.status(500).json({ error: "Database error fetching classes" });
    }

    if (!classes.length) {
      return res.json([]);
    }

    // 2. Get all class IDs to fetch members in one query
    const classIds = classes.map(c => c.ClassID);

    // 3. Fetch members for all these classes
    const sqlMembers = `
      SELECT 
        mc.ClassID, 
        u.UserID, 
        u.FirstName, 
        u.LastName, 
        u.Email, 
        u.Phone
      FROM members_classes mc
      JOIN users u ON mc.MemberID = u.UserID
      WHERE mc.ClassID IN (?)
    `;

    db.query(sqlMembers, [classIds], (err2, members) => {
      if (err2) {
        console.error("[DB ERROR] Fetching members failed:", err2);
        return res.status(500).json({ error: "Database error fetching members" });
      }

      // 4. Group members by class
      const membersByClass = {};
      members.forEach(m => {
        if (!membersByClass[m.ClassID]) membersByClass[m.ClassID] = [];
        membersByClass[m.ClassID].push(m);
      });

      // 5. Attach members to each class object
      const result = classes.map(cls => ({
        ...cls,
        Members: membersByClass[cls.ClassID] || []
      }));

      res.json(result);
    });
  });
});
router.get("/stats", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "trainer") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const trainerId = user.UserID;

  const sqlTopType = `
    SELECT ct.id, ct.type
    FROM classes c
    JOIN class_types ct ON ct.id = c.ClassType
    LEFT JOIN members_classes mc ON mc.ClassID = c.ClassID
    WHERE c.TrainerID = ?
    GROUP BY ct.id, ct.type
    ORDER BY COUNT(mc.MemberID) DESC, ct.type ASC
    LIMIT 1
  `;

  const sqlTopTimes = `
    SELECT DATE_FORMAT(c.time, '%H:%i') AS class_time
    FROM classes c
    LEFT JOIN members_classes mc ON mc.ClassID = c.ClassID
    WHERE c.TrainerID = ?
    GROUP BY class_time
    HAVING class_time IS NOT NULL
    ORDER BY COUNT(mc.MemberID) DESC, class_time ASC
    LIMIT 3
  `;

  db.query(sqlTopType, [trainerId], (err1, rowsType) => {
    if (err1) {
      console.error("Error fetching top type:", err1);
      return res.status(500).json({ error: "Database error" });
    }
    db.query(sqlTopTimes, [trainerId], (err2, rowsTimes) => {
      if (err2) {
        console.error("Error fetching top times:", err2);
        return res.status(500).json({ error: "Database error" });
      }
      const topType = rowsType && rowsType[0] ? rowsType[0] : null;
      const topTimes = (rowsTimes || []).map(r => r.class_time);
      res.json({ topType, topTimes });
    });
  });
});


module.exports = router;
