// routes/admin.js
const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mime = require("mime-types");

const db = dbSingleton.getConnection();

/* ----------------- ensure /uploads exists ----------------- */
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

/* ----------------- multer storage ----------------- */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

/* ===========================================================
 * Register trainer (user goes to role=onHold)
 * ===========================================================
 */
router.post("/register-trainer", upload.single("certifications"), (req, res) => {
  const { firstName, lastName, phone, email, dateOfBirth, password } = req.body;
  const certifications = req.file ? req.file.filename : null;

  if (!firstName || !lastName || !phone || !email || !dateOfBirth || !password || !certifications) {
    return res.status(400).json({ error: "All fields including certifications are required." });
  }

  db.query("SELECT * FROM users WHERE email = ? OR phone = ?", [email, phone], (err, results) => {
    if (err) return res.status(500).json({ error: "Internal server error." });
    if (results.some((u) => u.email === email)) return res.status(400).json({ error: "Email already exists." });
    if (results.some((u) => u.phone === phone)) return res.status(400).json({ error: "Phone already exists." });

    bcrypt.genSalt(10, (err, salt) => {
      if (err) return res.status(500).json({ error: "Failed to secure password." });

      bcrypt.hash(password, salt, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: "Failed to secure password." });

        const userSql =
          "INSERT INTO users (FirstName, LastName, Phone, Email, DateOfBirth, Role, Password) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(
          userSql,
          [firstName, lastName, phone, email, dateOfBirth, "onHold", hashedPassword],
          (err, userResult) => {
            if (err) return res.status(500).json({ error: "Failed to create user account. Try again." });
            const userId = userResult.insertId;

            const trainerSql = "INSERT INTO trainers (UserID, Certifications) VALUES (?, ?)";
            db.query(trainerSql, [userId, certifications], (e2) => {
              if (e2) return res.status(500).json({ error: "Failed to register trainer info." });
              res.json({ message: "Trainer registration submitted. Await admin approval." });
            });
          }
        );
      });
    });
  });
});

/* ===========================================================
 * Download / Preview trainer certification
 * GET /admin/trainer-cert/:userId[?download=1]
 * ===========================================================
 */
router.get("/trainer-cert/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT Certifications FROM trainers WHERE UserID = ?";

  db.query(sql, [userId], (err, rows) => {
    if (err || !rows || rows.length === 0) return res.status(404).send("Certification not found.");
    const safeName = path.basename(rows[0].Certifications || "");
    if (!safeName) return res.status(404).send("Certification not found.");

    const filePath = path.join(__dirname, "..", "uploads", safeName);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found on server.");

    const type = mime.lookup(filePath) || "application/octet-stream";
    const forceDownload = req.query.download === "1";

    if (forceDownload) {
      res.setHeader("Content-Type", type);
      return res.download(filePath, safeName, (e) => {
        if (e) return res.status(404).send("File not found on server.");
      });
    }

    if (type.startsWith("image/") || type === "application/pdf" || type.startsWith("text/")) {
      res.setHeader("Content-Type", type);
      res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
      return res.sendFile(filePath);
    }

    res.setHeader("Content-Type", type);
    return res.download(filePath, safeName, (e) => {
      if (e) return res.status(404).send("File not found on server.");
    });
  });
});

/* ===========================================================
 * Pending / Approvals
 * ===========================================================
 */
router.get("/pending-trainers", (_req, res) => {
  const sql = `
    SELECT 
      u.UserID, u.FirstName, u.LastName, u.Phone, u.Email, u.DateOfBirth, u.Role,
      t.Certifications
    FROM users u
    JOIN trainers t ON u.UserID = t.UserID
    WHERE u.Role = 'onHold'
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB error (pending trainers):", err);
      return res.status(500).json({ error: "Failed to fetch pending trainers." });
    }
    res.json(results || []);
  });
});

router.post("/approve-trainer", (req, res) => {
  const { UserID } = req.body;
  db.query("UPDATE users SET Role = 'trainer' WHERE UserID = ?", [UserID], (err) => {
    if (err) return res.status(500).json({ error: "Failed to approve trainer." });
    res.json({ message: "Trainer approved successfully." });
  });
});

router.post("/reject-trainer", (req, res) => {
  const { UserID } = req.body;
  db.query("DELETE FROM trainers WHERE UserID = ?", [UserID], (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete trainer info." });
    db.query("DELETE FROM users WHERE UserID = ?", [UserID], (err2) => {
      if (err2) return res.status(500).json({ error: "Failed to delete user." });
      res.json({ message: "Trainer rejected and removed." });
    });
  });
});

/* ===========================================================
 * Class types CRUD  (+ safeguards for MaxParticipants updates)
 * ===========================================================
 */
router.get("/class-types", (_req, res) => {
  db.query("SELECT id, type, MaxParticipants FROM class_types", (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results || []);
  });
});

router.post("/class-types", (req, res) => {
  const { type, MaxParticipants } = req.body;
  if (!type || typeof MaxParticipants !== "number" || MaxParticipants < 1) {
    return res.status(400).json({ error: "Missing/invalid type or MaxParticipants." });
  }
  db.query(
    "INSERT INTO class_types (type, MaxParticipants) VALUES (?, ?)",
    [type, MaxParticipants],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true, id: result.insertId });
    }
  );
});

router.delete("/class-types/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM class_types WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ success: true });
  });
});

/**
 * PUT /admin/class-types/set-max
 * Set a SINGLE MaxParticipants for ALL class types.
 * Blocks if ANY class has booked > new max.
 * Returns { updated:false, conflicts:<count> } when blocked.
 */
router.put("/class-types/set-max", (req, res) => {
  const max = Number(req.body.max);
  if (!Number.isFinite(max) || max < 1) return res.status(400).json({ error: "Missing/invalid max value." });

  const qConflicts = `
  SELECT COUNT(*) AS conflicts FROM (
    SELECT c.ClassID, COUNT(mc.MemberID) AS booked
    FROM classes c
    LEFT JOIN members_classes mc ON mc.ClassID = c.ClassID
    WHERE CONCAT(c.Schedule,' ',COALESCE(c.time,'00:00:00')) >= NOW()
    GROUP BY c.ClassID
  ) t
  WHERE t.booked > ?
`;


  db.query(qConflicts, [max], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error (check)" });
    const conflicts = Number(rows?.[0]?.conflicts || 0);
    if (conflicts > 0) return res.json({ updated: false, conflicts });

    db.query("UPDATE class_types SET MaxParticipants = ?", [max], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error (update)" });
      res.json({ updated: true, conflicts: 0 });
    });
  });
});

/**
 * PUT /admin/class-type/:id/max
 * Set MaxParticipants for ONE class type.
 * Blocks if ANY class of this type has booked > new max.
 * Returns { updated:false, conflicts:<count> } when blocked.
 */
router.put("/class-type/:id/max", (req, res) => {
  const typeId = Number(req.params.id);
  const max = Number(req.body.MaxParticipants);
  if (!Number.isFinite(typeId) || !Number.isFinite(max) || max < 1) {
    return res.status(400).json({ error: "Bad params." });
  }

  const qConflicts = `
  SELECT COUNT(*) AS conflicts FROM (
    SELECT c.ClassID, COUNT(mc.MemberID) AS booked
    FROM classes c
    LEFT JOIN members_classes mc ON mc.ClassID = c.ClassID
    WHERE c.ClassType = ?
      AND CONCAT(c.Schedule,' ',COALESCE(c.time,'00:00:00')) >= NOW()
    GROUP BY c.ClassID
  ) t
  WHERE t.booked > ?
`;


  db.query(qConflicts, [typeId, max], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error (check)" });
    const conflicts = Number(rows?.[0]?.conflicts || 0);
    if (conflicts > 0) return res.json({ updated: false, conflicts });

    db.query("UPDATE class_types SET MaxParticipants = ? WHERE id = ?", [max, typeId], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error (update)" });
      res.json({ updated: true, conflicts: 0 });
    });
  });
});

/* ===========================================================
 * Classes lists (upcoming / previous 30 days) with booked count
 * ===========================================================
 */
router.get("/all-upcoming-classes-with-count", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "admin") return res.status(401).json({ error: "Unauthorized" });

  const sql = `
    SELECT
      c.ClassID,
      c.Schedule,
      c.time,
      c.TrainerID,
      u.FirstName AS TrainerFirstName,
      u.LastName  AS TrainerLastName,
      ct.type     AS ClassTypeName,
      c.ClassType,
      ct.MaxParticipants,
      IFNULL(b.bookedCount, 0) AS bookedCount
    FROM classes c
    JOIN users u      ON c.TrainerID = u.UserID
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
    res.json(results || []);
  });
});

router.get("/all-previous-30days-classes-with-count", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "admin") return res.status(401).json({ error: "Unauthorized" });

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  const toSql = (d) => d.toISOString().slice(0, 19).replace("T", " ");

  const sql = `
    SELECT
      c.ClassID,
      c.Schedule,
      c.time,
      c.TrainerID,
      u.FirstName AS TrainerFirstName,
      u.LastName  AS TrainerLastName,
      ct.type     AS ClassTypeName,
      c.ClassType,
      ct.MaxParticipants,
      IFNULL(b.bookedCount, 0) AS bookedCount
    FROM classes c
    JOIN users u      ON c.TrainerID = u.UserID
    JOIN class_types ct ON c.ClassType = ct.id
    LEFT JOIN (
      SELECT ClassID, COUNT(*) AS bookedCount
      FROM members_classes
      GROUP BY ClassID
    ) b ON c.ClassID = b.ClassID
    WHERE CONCAT(c.Schedule, ' ', c.time) BETWEEN ? AND ?
    ORDER BY c.Schedule ASC, c.time ASC
  `;
  db.query(sql, [toSql(from), toSql(now)], (err, results) => {
    if (err) {
      console.error("Error fetching last 30 days classes:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results || []);
  });
});

/* ===========================================================
 * Analytics (+ People / Insights / Members / Delete user)
 * ===========================================================
 */
router.get("/analytics", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "admin") return res.status(401).json({ error: "Unauthorized" });

  const { window = "30d" } = req.query;
  const now = new Date();

  const toSql = (d) => d.toISOString().slice(0, 19).replace("T", " ");
  let start, end;
  if (window === "all") {
    start = new Date("2000-01-01T00:00:00");
    end = new Date(now.toISOString().slice(0, 10) + "T23:59:59");
  } else {
    start = new Date(now);
    start.setDate(start.getDate() - 30);
    end = now;
  }
  const startStr = toSql(start);
  const endStr = toSql(end);

  const qTopClassTypes = `
    SELECT
      ct.id,
      ct.type,
      COUNT(mc.MemberID)              AS bookings,
      COUNT(DISTINCT c.ClassID)       AS classesHeld,
      SUM(ct.MaxParticipants)         AS capacityTotal
    FROM classes c
    JOIN class_types ct ON c.ClassType = ct.id
    LEFT JOIN members_classes mc ON mc.ClassID = c.ClassID
    WHERE CONCAT(c.Schedule, ' ', c.time) BETWEEN ? AND ?
    GROUP BY ct.id, ct.type
    ORDER BY bookings DESC
    LIMIT 10
  `;

  const qTopTrainers = `
    SELECT
      u.UserID,
      u.FirstName,
      u.LastName,
      COUNT(mc.MemberID)        AS bookings,
      COUNT(DISTINCT c.ClassID) AS classesHeld
    FROM classes c
    JOIN users u ON u.UserID = c.TrainerID
    LEFT JOIN members_classes mc ON mc.ClassID = c.ClassID
    WHERE CONCAT(c.Schedule, ' ', c.time) BETWEEN ? AND ?
    GROUP BY u.UserID, u.FirstName, u.LastName
    ORDER BY bookings DESC
    LIMIT 10
  `;

  const qLeastTrainers = `
    SELECT
      u.UserID,
      u.FirstName,
      u.LastName,
      COUNT(mc.MemberID)        AS bookings,
      COUNT(DISTINCT c.ClassID) AS classesHeld
    FROM classes c
    JOIN users u ON u.UserID = c.TrainerID
    LEFT JOIN members_classes mc ON mc.ClassID = c.ClassID
    WHERE CONCAT(c.Schedule, ' ', c.time) BETWEEN ? AND ?
    GROUP BY u.UserID, u.FirstName, u.LastName
    ORDER BY bookings ASC, classesHeld ASC
    LIMIT 10
  `;

  const qPopularTimes = `
    SELECT DATE_FORMAT(c.time, '%H:00') AS hourSlot, COUNT(mc.MemberID) AS bookings
    FROM classes c
    LEFT JOIN members_classes mc ON mc.ClassID = c.ClassID
    WHERE CONCAT(c.Schedule, ' ', c.time) BETWEEN ? AND ?
    GROUP BY hourSlot
    ORDER BY bookings DESC, hourSlot ASC
    LIMIT 3
  `;

  const P = (sql, params) =>
    new Promise((resolve, reject) => db.query(sql, params, (e, r) => (e ? reject(e) : resolve(r))));

  const thirtyStart = toSql(new Date(now.getTime() - 30 * 86400000));
  const allStart = "2000-01-01 00:00:00";
  const endNow = toSql(now);

  Promise.all([
    P(qTopClassTypes, [startStr, endStr]),
    P(qTopTrainers, [startStr, endStr]),
    P(qLeastTrainers, [startStr, endStr]),
    P(qPopularTimes, [thirtyStart, endNow]),
    P(qPopularTimes, [allStart, endNow]),
  ])
    .then(([topClassTypes, topTrainers, leastTrainers, popularTimes30, popularTimesAll]) => {
      const classTypes = (topClassTypes || []).map((row) => {
        const capacity = Number(row.capacityTotal || 0);
        const bookings = Number(row.bookings || 0);
        const utilization = capacity > 0 ? +(bookings / capacity).toFixed(2) : 0;
        return { ...row, utilization };
      });
      res.json({
        since: startStr,
        until: endStr,
        classTypes,
        topTrainers,
        leastTrainers,
        popularTimes30: popularTimes30 || [],
        popularTimesAll: popularTimesAll || [],
      });
    })
    .catch((err) => {
      console.error("Analytics error:", err);
      res.status(500).json({ error: "Analytics error" });
    });
});

/* ===========================================================
 * People Explorer / Insights / Members / Delete user
 * ===========================================================
 */
router.get("/people", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "admin") return res.status(401).json({ error: "Unauthorized" });

  const role = (req.query.role || "").trim();
  const q = (req.query.q || "").trim();

  let where = "1=1";
  const params = [];

  if (role && role !== "all") {
    where += " AND u.Role = ?";
    params.push(role);
  }
  if (q) {
    where += " AND (CONCAT(u.FirstName,' ',u.LastName) LIKE ? OR u.Email LIKE ? OR u.Phone LIKE ?)";
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const sql = `
    SELECT u.UserID, u.FirstName, u.LastName, u.Email, u.Phone, u.Role, u.DateOfBirth,
           t.Certifications
    FROM users u
    LEFT JOIN trainers t ON t.UserID = u.UserID
    WHERE ${where}
    ORDER BY u.LastName, u.FirstName
    LIMIT 500
  `;

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error("DB error (people):", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows || []);
  });
});

router.get("/trainer-insights/:trainerId", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "admin") return res.status(401).json({ error: "Unauthorized" });

  const { trainerId } = req.params;
  const window = (req.query.window || "30d").toLowerCase();

  const now = new Date();
  let start = new Date("2000-01-01T00:00:00");
  let end = new Date(now.toISOString().slice(0, 10) + "T23:59:59");
  if (window !== "all") {
    start = new Date(now);
    start.setDate(start.getDate() - 30);
  }

  const toSql = (d) => d.toISOString().slice(0, 19).replace("T", " ");
  const startStr = toSql(start);
  const endStr = toSql(end);

  const qTotals = `
    SELECT 
      COUNT(DISTINCT c.ClassID) AS classes,
      COUNT(mc.MemberID)        AS bookings,
      SUM(ct.MaxParticipants)   AS capacity
    FROM classes c
    JOIN class_types ct ON ct.id = c.ClassType
    LEFT JOIN members_classes mc ON mc.ClassID = c.ClassID
    WHERE c.TrainerID = ? AND CONCAT(c.Schedule, ' ', c.time) BETWEEN ? AND ?
  `;

  const qTopTypes = `
    SELECT ct.type, COUNT(mc.MemberID) AS bookings
    FROM classes c
    JOIN class_types ct ON ct.id = c.ClassType
    LEFT JOIN members_classes mc ON mc.ClassID = c.ClassID
    WHERE c.TrainerID = ? AND CONCAT(c.Schedule, ' ', c.time) BETWEEN ? AND ?
    GROUP BY ct.id, ct.type
    ORDER BY bookings DESC
    LIMIT 5
  `;

  const qTimes = `
    SELECT DATE_FORMAT(time, '%H:00') AS hourSlot, COUNT(mc.MemberID) AS bookings
    FROM classes c
    LEFT JOIN members_classes mc ON mc.ClassID = c.ClassID
    WHERE c.TrainerID = ? AND CONCAT(c.Schedule, ' ', c.time) BETWEEN ? AND ?
    GROUP BY hourSlot
    ORDER BY bookings DESC, hourSlot ASC
    LIMIT 12
  `;

  const qUpcoming = `
    SELECT c.ClassID, c.Schedule, c.time, ct.type, ct.MaxParticipants,
           IFNULL(b.bookedCount, 0) AS bookedCount
    FROM classes c
    JOIN class_types ct ON c.ClassType = ct.id
    LEFT JOIN (
      SELECT ClassID, COUNT(*) AS bookedCount
      FROM members_classes
      GROUP BY ClassID
    ) b ON c.ClassID = b.ClassID
    WHERE c.TrainerID = ? AND CONCAT(c.Schedule, ' ', c.time) >= NOW()
    ORDER BY c.Schedule ASC, c.time ASC
    LIMIT 5
  `;

  const qRecent = `
    SELECT c.ClassID, c.Schedule, c.time, ct.type, ct.MaxParticipants,
           IFNULL(b.bookedCount, 0) AS bookedCount
    FROM classes c
    JOIN class_types ct ON c.ClassType = ct.id
    LEFT JOIN (
      SELECT ClassID, COUNT(*) AS bookedCount
      FROM members_classes
      GROUP BY ClassID
    ) b ON c.ClassID = b.ClassID
    WHERE c.TrainerID = ? AND CONCAT(c.Schedule, ' ', c.time) < NOW()
    ORDER BY c.Schedule DESC, c.time DESC
    LIMIT 10
  `;

  const P = (sql, params) =>
    new Promise((resolve, reject) => db.query(sql, params, (e, r) => (e ? reject(e) : resolve(r))));

  Promise.all([
    P(qTotals, [trainerId, startStr, endStr]),
    P(qTopTypes, [trainerId, startStr, endStr]),
    P(qTimes, [trainerId, startStr, endStr]),
    P(qUpcoming, [trainerId]),
    P(qRecent, [trainerId]),
  ])
    .then(([totals, topTypes, times, upcoming, recent]) => {
      const t = totals?.[0] || { classes: 0, bookings: 0, capacity: 0 };
      const avgUtilization = t.capacity > 0 ? +(t.bookings / t.capacity).toFixed(2) : 0;
      res.json({
        totals: { classes: t.classes || 0, bookings: t.bookings || 0, avgUtilization },
        topTypes: topTypes || [],
        popularTimes: times || [],
        upcoming: upcoming || [],
        recent: recent || [],
      });
    })
    .catch((e) => {
      console.error("trainer-insights error:", e);
      res.status(500).json({ error: "Failed insights" });
    });
});

router.get("/class-members/:classId", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "admin") return res.status(401).json({ error: "Unauthorized" });

  const { classId } = req.params;
  const sql = `
    SELECT DISTINCT u.UserID, u.FirstName, u.LastName, u.Email, u.Phone
    FROM members_classes mc
    JOIN users u ON mc.MemberID = u.UserID
    WHERE mc.ClassID = ?
    ORDER BY u.LastName, u.FirstName
  `;
  db.query(sql, [classId], (err, rows) => {
    if (err) {
      console.error("DB error (class-members):", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows || []);
  });
});

router.delete("/user/:id", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "admin") return res.status(401).json({ error: "Unauthorized" });

  const userId = Number(req.params.id);

  db.query("SELECT Role FROM users WHERE UserID = ?", [userId], (e, rows) => {
    if (e) return res.status(500).json({ error: "Database error (lookup)" });
    if (!rows || rows.length === 0) return res.status(404).json({ error: "User not found" });

    const role = rows[0].Role;

    const run = (sql, params) =>
      new Promise((resolve, reject) => db.query(sql, params, (err) => (err ? reject(err) : resolve())));

    (async () => {
      try {
        await run("DELETE FROM members_classes WHERE MemberID = ?", [userId]);

        if (role === "trainer" || role === "onHold") {
          const classes = await new Promise((resolve, reject) =>
            db.query("SELECT ClassID FROM classes WHERE TrainerID = ?", [userId], (err, rs) =>
              err ? reject(err) : resolve(rs || [])
            )
          );
          const classIds = classes.map((c) => c.ClassID);
          if (classIds.length > 0) {
            await run(`DELETE FROM members_classes WHERE ClassID IN (${classIds.map(() => "?").join(",")})`, classIds);
            await run(`DELETE FROM classes WHERE ClassID IN (${classIds.map(() => "?").join(",")})`, classIds);
          }
          await run("DELETE FROM trainers WHERE UserID = ?", [userId]);
        }

        await run("DELETE FROM users WHERE UserID = ?", [userId]);
        res.json({ success: true });
      } catch (err) {
        console.error("Delete user error:", err);
        res.status(500).json({ error: "Failed to delete user" });
      }
    })();
  });
});

module.exports = router;
