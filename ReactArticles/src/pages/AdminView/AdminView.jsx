// src/pages/AdminView.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import styles from "./AdminView.module.css";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

export default function AdminView({ user, setUser }) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalMembers: "-",
    totalTrainers: "-",
    totalClasses: "-",
    activeMemberships: "-"
  });

  // Pending trainers
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");

  // Chart data
  const chartData = [
    { name: "Members", value: Number(stats.totalMembers) || 0 },
    { name: "Trainers", value: Number(stats.totalTrainers) || 0 },
    { name: "Classes", value: Number(stats.totalClasses) || 0 },
    { name: "Active Memberships", value: Number(stats.activeMemberships) || 0 }
  ];

  useEffect(() => {
    if (!user || !user.Role) return;
    if (user.Role !== "admin") {
      navigate("/" + user.Role);
    } else {
      setAuthorized(true);
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
axios.get("http://localhost:8801/admin/dashboard-stats", { withCredentials: true })
      .then(res => setStats(res.data))
      .catch(() => setStats({ totalMembers: "-", totalTrainers: "-", totalClasses: "-", activeMemberships: "-" }));
  }, []);

  // Fetch pending trainers on load
  useEffect(() => {
    setPendingLoading(true);
    axios.get("/admin/pending-trainers", { withCredentials: true })
      .then(res => setPending(res.data))
      .catch(() => setPending([]))
      .finally(() => setPendingLoading(false));
  }, [pendingStatus]);

  function handleApprove(UserID) {
    setPendingStatus("");
    axios.post("/admin/approve-trainer", { UserID }, { withCredentials: true })
      .then(() => {
        setPendingStatus("Trainer approved!");
        setPending(prev => prev.filter(t => t.UserID !== UserID));
      })
      .catch(() => setPendingStatus("Error approving trainer."));
  }

  function handleReject(UserID) {
    setPendingStatus("");
    axios.post("/admin/reject-trainer", { UserID }, { withCredentials: true })
      .then(() => {
        setPendingStatus("Trainer rejected.");
        setPending(prev => prev.filter(t => t.UserID !== UserID));
      })
      .catch(() => setPendingStatus("Error rejecting trainer."));
  }

  if (!authorized) return null;

  return (
    <div className={styles.bgWrapper}>
      {images.map((img, idx) => (
        <div
          key={idx}
          className={styles.bgImg}
          style={{
            backgroundImage: `url(${img})`,
            opacity: bgIndex === idx ? 1 : 0,
            zIndex: 1,
            transition: "opacity 1.2s"
          }}
        />
      ))}
      <div className={styles.overlay} />
      <AdminHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />
      <main className={styles.mainContent}>
        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}><div>Total Members</div><div>{stats.totalMembers}</div></div>
          <div className={styles.statCard}><div>Total Trainers</div><div>{stats.totalTrainers}</div></div>
          <div className={styles.statCard}><div>Total Classes</div><div>{stats.totalClasses}</div></div>
          <div className={styles.statCard}><div>Active Memberships</div><div>{stats.activeMemberships}</div></div>
        </div>

        {/* Chart */}
        <div className={styles.platformOverview}>
          <div className={styles.platformOverviewHeader}>Platform Overview</div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#5efcb1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Trainers Section */}
        <div className={styles.pendingSection}>
          <div className={styles.pendingHeaderSection}>
            <span>Pending Trainer Approvals</span>
            {pendingStatus && (
              <span className={styles.pendingStatus}>{pendingStatus}</span>
            )}
          </div>
          {pendingLoading ? (
            <div className={styles.emptyStateAdmin}>Loading...</div>
          ) : pending.length === 0 ? (
            <div className={styles.emptyStateAdmin}>No pending trainers.</div>
          ) : (
            <div className={styles.pendingTrainersGrid}>
              {pending.map(trainer => (
                <div className={styles.trainerCardAdmin} key={trainer.UserID}>
                  <div className={styles.trainerNameAdmin}>⏳ {trainer.FirstName} {trainer.LastName}</div>
                  <div className={styles.trainerDetailAdmin}><b>Email:</b> {trainer.Email}</div>
                  <div className={styles.trainerDetailAdmin}><b>Phone:</b> {trainer.Phone}</div>
                  <div className={styles.trainerDetailAdmin}><b>Date of Birth:</b> {trainer.DateOfBirth?.slice(0,10)}</div>
                  <div className={styles.trainerDetailAdmin}>
                    <b>Certification:</b>{" "}
                    {trainer.Certifications
                      ? (
                        <a
                          href={`http://localhost:8801/uploads/${trainer.Certifications}`}
                          className={styles.certLinkAdmin}
                          download={trainer.Certifications}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Document
                        </a>
                      )
                      : <span style={{ color: "#f36" }}>No document</span>
                    }
                  </div>
                  <div className={styles.trainerActionsAdmin}>
                    <button className={styles.buttonApprove} onClick={() => handleApprove(trainer.UserID)}>Approve</button>
                    <button className={styles.buttonReject} onClick={() => handleReject(trainer.UserID)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ProfileModal
        show={showProfile}
        onClose={() => setShowProfile(false)}
        userData={user}
        onUpdate={setUser}
      />
    </div>
  );
}
