const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const nodemailer = require('nodemailer');
const db = dbSingleton.getConnection();

// Membership class amounts per plan (update here if you change your plans)
const CLASS_PER_MONTH = {
  1: 0, // Basic: MembershipTypeId = 1
  2: 2, // Standard: MembershipTypeId = 2
  3: 4  // Premium: MembershipTypeId = 3
};

// Register Membership API
router.post("/register-membership", (req, res) => {
  const { userId, membershipTypeId, months } = req.body;

  if (!userId || !membershipTypeId || !months) {
    return res.status(400).json({ error: "Missing required data" });
  }

  // Calculate class amount for this purchase
  const classPerMonth = CLASS_PER_MONTH[membershipTypeId] ?? 0;
  const totalClasses = classPerMonth * months;

  // Dates
  const now = new Date();
  const startDate = now.toISOString().split("T")[0];
  const endDateObj = new Date(now);
  endDateObj.setMonth(endDateObj.getMonth() + parseInt(months));
  const endDate = endDateObj.toISOString().split("T")[0];

  // Insert new membership row
  const sql = `
    INSERT INTO membership 
      (MemberShipType, UserID, ClassAmount, StartDate, EndDate) 
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [membershipTypeId, userId, totalClasses, startDate, endDate],
    (err, result) => {
      if (err) {
        console.error("Error inserting membership:", err);
        return res.status(500).json({ error: "Database error" });
      }
      // Return the dates for the receipt
      return res.json({
        success: true,
        membershipId: result.insertId,
        classAmount: totalClasses,
        startDate,
        endDate
      });
    }
  );
});

router.post("/update-role", (req, res) => {
  const { userId, newRole } = req.body;

  if (!userId || !newRole) {
    return res.status(400).json({ error: "Missing userId or newRole" });
  }

  const sql = "UPDATE users SET Role = ? WHERE UserID = ?";
  db.query(sql, [newRole, userId], (err, result) => {
    if (err) {
      console.error("Error updating user role:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    // Update the session (if this is the logged in user)
    if (req.session.user && req.session.user.UserID == userId) {
      req.session.user.Role = newRole;
    }
    res.json({ success: true });
  });
});

//send purchase receipt
router.post('/send-receipt', async (req, res) => {
  
  const { userId, planName, duration, total, startDate, endDate } = req.body;
  if (!userId || !planName || !duration || !total || !startDate || !endDate)
    return res.status(400).json({ error: "Missing data for receipt" });

  // Fetch user info (name, email)
  db.query(
    "SELECT FirstName, LastName, Email FROM users WHERE UserID = ? LIMIT 1",
    [userId],
    async (err, results) => {
      if (err || results.length === 0) {
        console.error("DB/user error:", err);
        return res.status(500).json({ error: "User lookup failed" });
      }
      const { FirstName, LastName, Email } = results[0];

      // Prepare the receipt email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '') // Remove spaces
        }
      }); 
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

      const mailOptions = {
        from: `"Refit Gym" <${process.env.GMAIL_USER}>`,
        to: Email,
        subject: 'Your Refit Membership Receipt',
        html: `
          <h2>Thank you, ${FirstName} ${LastName}!</h2>
          <p>Your membership purchase was successful.</p>
          <ul>
            <li><strong>Plan:</strong> ${planName}</li>
            <li><strong>Duration:</strong> ${duration} month(s)</li>
            <li><strong>Total paid:</strong> ${total} ₪</li>
            <li><strong>Purchase date:</strong> ${formattedDate}</li>
            <li><strong>Membership period:</strong> ${startDate} to ${endDate}</li>
            <li><strong>Email:</strong> ${Email}</li>
          </ul>
          <p>If you have questions, reply to this email.</p>
          <hr/>
          <p>Refit Gym Team</p>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
      } catch (emailErr) {
        console.error("Failed to send receipt:", emailErr);
        res.status(500).json({ error: "Failed to send receipt" });
      }
    }
  );
});
// GET /api/class-types  → id, type, MaxParticipants
router.get("/class-types", (req, res) => {
  const sql = "SELECT id, type, MaxParticipants FROM class_types ORDER BY id ASC";
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error fetching class types:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows || []);
  });
});

module.exports = router;