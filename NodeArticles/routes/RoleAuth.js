const express = require("express");
const router = express.Router();
//WhoAmI (Role)
router.get("/", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not logged in" });
    }
    return res.json(req.session.user);
  });
module.exports = router;
