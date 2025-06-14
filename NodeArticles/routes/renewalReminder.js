const db = require("../dbSingleton").getConnection();
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const SENT_LOG_FILE = path.resolve(__dirname, "../renewal_email_log.json");

function loadSentLog() {
  if (!fs.existsSync(SENT_LOG_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SENT_LOG_FILE, "utf8"));
  } catch {
    return {};
  }
}
function saveSentLog(log) {
  fs.writeFileSync(SENT_LOG_FILE, JSON.stringify(log, null, 2));
}

function getLocalDateYYYYMMDD(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function checkMembershipExpiries() {
  // Use system LOCAL date, not UTC
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + 14);
  const targetDateStr = getLocalDateYYYYMMDD(targetDate);

  console.log("Node system date:", now.toString());
  console.log("--- Checking for memberships expiring on:", targetDateStr, "---");

  db.query(
    `SELECT m.UserID, m.EndDate, u.FirstName, u.LastName, u.Email
     FROM membership m
     JOIN users u ON m.UserID = u.UserID
     WHERE m.EndDate = ?`,
    [targetDateStr],
    async (err, results) => {
      if (err) return console.error("Error checking memberships:", err);

      console.log("Memberships expiring:", results);

      const sentLog = loadSentLog();

      for (const row of results) {
        const uniqueKey = `${row.Email}|${row.EndDate}`;
        if (!sentLog[uniqueKey]) {
          // Use raw string from DB for display
          const endDateFormatted = typeof row.EndDate === 'string'
            ? row.EndDate
            : getLocalDateYYYYMMDD(new Date(row.EndDate));

          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '')
            }
          });

          const mailOptions = {
            from: `"Refit Gym" <${process.env.GMAIL_USER}>`,
            to: row.Email,
            subject: 'Your Refit Gym Membership is Ending Soon',
            html: `
              <h2>Hi ${row.FirstName} ${row.LastName},</h2>
              <p>Your <b>Refit Gym membership</b> will expire in <b>one week</b> (on <b>${endDateFormatted}</b>).</p>
              <p>Please renew your membership soon to keep your access and avoid losing your classes.</p>
              <br>
              <p>Thank you for being with us!<br>Refit Gym Team</p>
            `
          };
          

          try {
            await transporter.sendMail(mailOptions);
            sentLog[uniqueKey] = true;
            saveSentLog(sentLog);
            console.log(`Renewal reminder sent to ${row.Email}`);
          } catch (err2) {
            console.error("Failed to send renewal reminder email:", err2);
          }
        } else {
          console.log(`Already sent to ${row.Email} for ${row.EndDate}`);
        }
      }
    }
  );
}

// Run once at startup for testing
setTimeout(checkMembershipExpiries, 3000);

// Run every 24 hours in production
setInterval(checkMembershipExpiries, 1000 * 60 * 60 * 24);

module.exports = {};
