const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const db = require("../dbSingleton").getConnection();

router.get("/class-types", (req, res) => {
  const sql = `SELECT id, type FROM class_types`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching class types:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results); // [{ id: 1, type: 'legs' }, ...]
  });
});


router.post("/classes", (req, res) => {
  const { classTypeName, date } = req.body;

  let sql = `
  SELECT
    c.ClassID,            
    ct.type AS ClassType,
    c.Schedule,
    c.time,
    c.MaxParticipants,
    u.FirstName AS TrainerFirstName,
    u.LastName AS TrainerLastName
  FROM classes c
  JOIN class_types ct ON c.ClassType = ct.id
  JOIN users u ON c.TrainerID = u.UserID
  WHERE u.Role = 'trainer'
`;
  let params = [];

  if (classTypeName && date) {
    sql += " AND ct.type = ? AND DATE(c.Schedule) = ?";
    params = [classTypeName, date];
  } else if (classTypeName) {
    sql += " AND ct.type = ?";
    params = [classTypeName];
  } else if (date) {
    sql += " AND DATE(c.Schedule) = ?";
    params = [date];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching classes:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});


router.get("/class-amount", (req, res) => {
  if (!req.session.user || !req.session.user.UserID) {
    return res.status(401).json({ error: "Unauthorized: Not logged in" });
  }

  const userId = req.session.user.UserID;
  const sql = "SELECT ClassAmount FROM membership WHERE UserID = ? LIMIT 1";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching class amount:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) return res.json({ classAmount: 0 });
    res.json({ classAmount: results[0].ClassAmount });
  });
});


router.post("/use-class", (req, res) => {
  const userId = req.session.user.UserID;
  const sqlCheck = "SELECT ClassAmount FROM membership WHERE UserID = ? LIMIT 1";
  db.query(sqlCheck, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0 || results[0].ClassAmount <= 0) {
      return res.status(400).json({ error: "No class credits left." });
    }
    const sqlUpdate = "UPDATE membership SET ClassAmount = ClassAmount - 1 WHERE UserID = ? AND ClassAmount > 0";
    db.query(sqlUpdate, [userId], (err2) => {
      if (err2) return res.status(500).json({ error: "Failed to use class." });
      res.json({ success: true });
    });
  });
});
router.post("/save-booking", (req, res) => {
  const userId = req.session.user.UserID;
  const { classId } = req.body;

  if (!classId) return res.status(400).json({ error: "Class ID missing" });

  const sql = "INSERT INTO members_classes (ClassID, MemberID) VALUES (?, ?)";
  db.query(sql, [classId, userId], (err, result) => {
    if (err) {
      console.error("Error saving booking:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true });
  });
});
// backend route (/routes/classes.js or wherever your route is defined)
router.get('/my-membership', (req, res) => {
  const userId = req.session.user?.UserID || req.query.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  db.query(`
    SELECT m.*, mt.Type AS PlanName 
    FROM membership m
    JOIN membership_type mt ON m.MemberShipType = mt.id
    WHERE m.UserID = ? AND m.EndDate >= CURDATE()
    ORDER BY m.EndDate DESC LIMIT 1
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
   
    if (!rows.length) return res.status(404).json({ error: "No active membership" });
    const row = rows[0];
    row._membershipKey = row.ID || row.MembershipID || row.id || row.UserID; // fallback for frontend localStorage key
    res.json(row);
  });
});

//STILL NOT DONE! 
router.post('/request-cancel-membership', (req, res) => {
  const userId = req.session.user?.UserID || req.body.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const msg = "Member requested membership cancellation";
  db.query(`
    INSERT INTO notifications (MessageContent, Status, NotificationDate, UserID, Type)
    VALUES (?, 'pending', NOW(), ?, 'cancellation')
  `, [msg, userId], (err) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ success: true });
  });
});

// PLANS config (keep in backend, same as frontend)
const plans = [
  { id: 1, name: "Basic", price: 120, classAmount: 0 },
  { id: 2, name: "Standard", price: 160, classAmount: 2 },
  { id: 3, name: "Premium", price: 200, classAmount: 4 }
];

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== new Date(dateStr).getDate()) d.setDate(0);
  return d.toISOString().slice(0, 10);
}

router.post("/renew-membership", async (req, res) => {
  try {
    const userId = req.session.user?.UserID;
    if (!userId) return res.status(401).json({ error: "Not logged in" });

    const { membershipTypeId, months, oldMembershipId } = req.body;
    if (!membershipTypeId || !months || !oldMembershipId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    db.query(
      "SELECT * FROM membership WHERE MemberShipID = ? AND UserID = ?",
      [oldMembershipId, userId],
      (err, results) => {
        if (err || results.length === 0) {
          return res.status(400).json({ error: "Membership not found" });
        }
        const oldMembership = results[0];

        // Get new plan info from local config
        const plan = plans.find(p => p.id === Number(membershipTypeId));
        if (!plan) {
          return res.status(400).json({ error: "Plan not found" });
        }
        const planName = plan.name;
        const planPrice = plan.price;
        const classesPerMonth = plan.classAmount;

        // Use old EndDate as start if it's in the future, else use today
        const todayStr = new Date().toISOString().slice(0, 10);
        const oldEndDateStr = oldMembership.EndDate?.toISOString
          ? oldMembership.EndDate.toISOString().slice(0, 10)
          : oldMembership.EndDate;
        const startDateForCalc = oldEndDateStr >= todayStr ? oldEndDateStr : todayStr;
        const newStartDate = startDateForCalc;
        const newEndDate = addMonths(newStartDate, months);

        // Add new classes to leftover
        const newClassAmount = (oldMembership.ClassAmount || 0) + (classesPerMonth * months);
        db.query(
          `UPDATE membership
            SET MemberShipType = ?, EndDate = ?, ClassAmount = ?
            WHERE MemberShipID = ? AND UserID = ?`,
          [
            membershipTypeId,
            newEndDate,
            newClassAmount,
            oldMembershipId,
            userId,
          ],
          (err3) => {
            if (err3) {
              return res.status(500).json({ error: "Database update failed" });
            }
            db.query(
              "SELECT * FROM membership WHERE MemberShipID = ?",
              [oldMembershipId],
              (err4, updatedMembershipRes) => {
                if (err4 || !updatedMembershipRes[0]) {
                  return res.status(500).json({ error: "Failed to get updated membership" });
                }
                const updatedMembership = updatedMembershipRes[0];
                db.query(
                  "SELECT * FROM users WHERE UserID = ?",
                  [userId],
                  async (err5, userRes) => {
                    if (err5 || !userRes[0]) {
                      return res.status(500).json({ error: "Failed to get user" });
                    }
                    const updatedUser = userRes[0];

                    // === SEND RENEW RECEIPT ===
                    try {
                      const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                          user: process.env.GMAIL_USER,
                          pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '')
                        }
                      });

                      const { FirstName, LastName, Email } = updatedUser;
                      const now = new Date();
                      const formattedDate = now.toLocaleDateString('en-GB', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                      });
                      const total = planPrice * months;

                      const mailOptions = {
                        from: `"Refit Gym" <${process.env.GMAIL_USER}>`,
                        to: Email,
                        subject: 'Refit Membership Renewal Receipt',
                        html: `
                          <h2>Thank you, ${FirstName} ${LastName}!</h2>
                          <p>Your <b>renewal</b> was successful.</p>
                          <ul>
                            <li><strong>Plan:</strong> ${planName}</li>
                            <li><strong>Duration:</strong> ${months} month(s)</li>
                            <li><strong>Total paid:</strong> ${total} ₪</li>
                            <li><strong>Purchase date:</strong> ${formattedDate}</li>
                            <li><strong>Membership period:</strong> ${newStartDate} to ${newEndDate}</li>
                            <li><strong>Email:</strong> ${Email}</li>
                          </ul>
                          <p>If you have questions, reply to this email.</p>
                          <hr/>
                          <p>Refit Gym Team</p>
                        `
                      };
                      await transporter.sendMail(mailOptions);
                    } catch (emailErr) {
                      console.error("Failed to send renew receipt:", emailErr);
                    }

                    // Return result to frontend
                    res.json({
                      success: true,
                      updatedMembership,
                      updatedUser,
                      totalPaid: planPrice * months,
                      planName,
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (e) {
    res.status(500).json({ error: "Unexpected server error" });
  }
});

module.exports = router;
