const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection();
router.post("/", (req, res) => {
    const { firstName, lastName, phone, email, dateOfBirth, role, password } = req.body;
    const query = "INSERT INTO users (firstName, lastName, phone, email, dateOfBirth, role, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(query, [firstName, lastName, phone, email, dateOfBirth, role, password], (err, results) => {
        if (err) {
            res.status(500).json({ error: "Database error" });
        }
        else{
            res.json({message:"User registered successfully"});
        }
    });
});
module.exports = router;