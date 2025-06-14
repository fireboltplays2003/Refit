import { useEffect, useState } from "react";
import styles from "./MyBookedClasses.module.css";
import axios from "axios";
import MemberHeader from "./MemberHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

function formatDateTime(iso, time) {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB") + (time ? " at " + time : "");
}

export default function MyBookedClasses({ user, setUser }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get("/member/my-booked-classes", { withCredentials: true })
      .then(res => {
        setClasses(res.data || []);
        setErr("");
      })
      .catch(() => setErr("Failed to load your classes."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleCancel(classId) {
    if (!window.confirm("Cancel this class? You'll get 1 class credit back.")) return;
    setCancelling(classId);
    try {
      await axios.post("/member/cancel-booked-class", { classId }, { withCredentials: true });
      setClasses(prev => prev.filter(c => c.ClassID !== classId));
    } catch (e) {
      if (e.response?.status === 404) {
        alert("Booking not found or already cancelled.");
        setClasses(prev => prev.filter(c => c.ClassID !== classId)); // Remove from UI anyway
      } else {
        alert("Failed to cancel class.");
      }
    }
    setCancelling(null);
  }

  return (
    <>
      <MemberHeader
        user={user}
        setUser={setUser}
        onProfile={() => setShowProfile(true)}
      />
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
        <main className={styles.mainContent}>
          <div className={styles.classesSection}>
            <h2 className={styles.title}>My Booked Classes</h2>
            {loading && <div className={styles.loader}>Loading...</div>}
            {err && <div className={styles.error}>{err}</div>}
            {!loading && !err && (
              <ul className={styles.classList}>
                {classes.length === 0 ? (
                  <li className={styles.empty}>You have no upcoming classes.</li>
                ) : classes.map(cls => (
                  <li key={cls.ClassID} className={styles.classCard}>
                    <div><strong>Type:</strong> {cls.ClassType}</div>
                    <div><strong>Date:</strong> {formatDateTime(cls.Schedule, cls.time)}</div>
                    <div><strong>Trainer:</strong> {cls.TrainerFirstName} {cls.TrainerLastName}</div>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => handleCancel(cls.ClassID)}
                      disabled={!!cancelling}
                      style={{
                        marginTop: 15,
                        background: "#ff6464",
                        color: "#fff",
                        border: "none",
                        borderRadius: "7px",
                        fontWeight: "700",
                        padding: "9px 18px",
                        cursor: cancelling ? "not-allowed" : "pointer",
                        opacity: cancelling === cls.ClassID ? 0.5 : 1
                      }}
                    >
                      {cancelling === cls.ClassID ? "Cancelling..." : "Cancel"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
        <Footer className={styles.footer} />
        <ProfileModal
          show={showProfile}
          onClose={() => setShowProfile(false)}
          userData={user}
          onUpdate={setUser}
        />
      </div>
    </>
  );
}
