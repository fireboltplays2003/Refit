import { useEffect, useState } from "react";
import styles from "./MyBookedClasses.module.css";
import axios from "axios";
import MemberHeader from "./MemberHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import { useNavigate } from "react-router-dom";
import LightSelect from "../../components/LightSelect"; // <-- restore custom select with scrolling

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

function formatDateTime(isoDate, time) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  let hour = "00", min = "00";
  if (time && time.length >= 5) [hour, min] = time.split(":");
  return `${day}/${month}/${year} ${hour}:${min}`;
}

export default function MyBookedClasses({ user, setUser }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [classTypes, setClassTypes] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.Role) {
      navigate("/login");
    } else if (user.Role !== "member") {
      navigate("/" + user.Role);
    }
  }, [user, navigate]);

  // Fetch classes and types
  useEffect(() => {
    setLoading(true);
    axios.get("/member/my-booked-classes", { withCredentials: true })
      .then(res => {
        setClasses(res.data || []);
        setErr("");
      })
      .catch(() => setErr("Failed to load your classes."))
      .finally(() => setLoading(false));
    axios.get("/member/class-types", { withCredentials: true })
      .then(res => setClassTypes(res.data || []))
      .catch(() => setClassTypes([]));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleCancel(classId) {
    setErr("");
    setMsg("");
    setCancelling(classId);
    try {
      await axios.post("/member/cancel-booked-class", { classId }, { withCredentials: true });
      setClasses(prev => prev.filter(c => c.ClassID !== classId));
      setMsg("Class cancelled successfully and credit returned.");
    } catch (e) {
      if (e.response?.status === 404) {
        setErr("Booking not found or already cancelled.");
        setClasses(prev => prev.filter(c => c.ClassID !== classId));
      } else {
        setErr("Failed to cancel class.");
      }
    }
    setCancelling(null);
    setConfirmCancelId(null);
  }

  // Filter/split classes by upcoming/history
  const now = new Date();

  const upcomingClasses = [...classes]
    .filter(cls => new Date(`${cls.Schedule}T${cls.time || "00:00"}`) >= now);
  const historyClasses = [...classes]
    .filter(cls => new Date(`${cls.Schedule}T${cls.time || "00:00"}`) < now);

  // Apply filter logic (date/type)
  function filterList(list) {
    return list.filter(cls => {
      let match = true;
      if (filterDate) match = match && cls.Schedule === filterDate;
      if (filterType) match = match && String(cls.ClassType) === String(filterType);
      return match;
    }).sort((a, b) => {
      const aDate = new Date(`${a.Schedule}T${a.time || "00:00"}`);
      const bDate = new Date(`${b.Schedule}T${b.time || "00:00"}`);
      return activeTab === "upcoming" ? aDate - bDate : bDate - aDate;
    });
  }

  const displayedClasses =
    activeTab === "upcoming" ? filterList(upcomingClasses) : filterList(historyClasses);

  return (
    <>
      <MemberHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />
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
          {/* --- FILTERS ROW --- */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Date:</label>
              <input
                type="date"
                className={styles.filterDateInput}
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                max="2099-12-31"
              />
            </div>

            {/* Type group lifted together */}
            <div className={`${styles.filterGroup} ${styles.typeGroup}`}>
              <label className={styles.filterLabel}>Type:</label>
              <span className={styles.selectInline}>
                <LightSelect
                  value={filterType}
                  onChange={(v) => setFilterType(v)}
                  placeholder="All Types"
                  options={[
                    { value: "", label: "All Types" },
                    ...classTypes.map(t => ({
                      value: t.type || t.ClassType || t.id,
                      label: t.type || t.ClassType || String(t.id)
                    }))
                  ]}
                />
              </span>
            </div>
          </div>

          {/* --- TABS --- */}
          <div className={styles.tabHeaderRow}>
            <button
              className={`${styles.tabBtn} ${activeTab === "upcoming" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("upcoming")}
              type="button"
            >
              My Classes
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "history" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("history")}
              type="button"
            >
              Class History
            </button>
          </div>

          {/* --- CARD CONTAINER --- */}
          <div className={styles.card}>
            {activeTab === "upcoming" && <div className={styles.title}>My Upcoming Classes</div>}
            {activeTab === "history" && <div className={styles.title}>Class History</div>}
            <div className={styles.underline}></div>

            {loading ? (
              <div className={styles.emptyMsg}>Loading...</div>
            ) : displayedClasses.length === 0 ? (
              <div className={styles.emptyMsg}>
                {activeTab === "upcoming" ? "You have no upcoming classes." : "No class history yet."}
              </div>
            ) : (
              <ul className={styles.classList}>
                {displayedClasses.map(cls => (
                  <li key={cls.ClassID} className={styles.classItem}>
                    <div className={styles.classRow}>
                      <div className={styles.classDetails}>
                        <div className={styles.classType}>
                          {cls.ClassType || cls.ClassTypeName || "Class"}
                        </div>
                        <div className={styles.classDateTime}>
                          {formatDateTime(cls.Schedule, cls.time)}
                        </div>
                        <div className={styles.classTrainer}>
                          Trainer: {cls.TrainerFirstName} {cls.TrainerLastName}
                        </div>
                      </div>

                      <div className={styles.classActions}>
                        {activeTab === "upcoming" && (
                          confirmCancelId === cls.ClassID ? (
                            <div>
                              <span className={styles.confirmMsg}>Are you sure?</span>
                              <button
                                onClick={() => handleCancel(cls.ClassID)}
                                disabled={cancelling === cls.ClassID}
                                className={styles.confirmBtn}
                              >
                                {cancelling === cls.ClassID ? "Cancelling..." : "Yes"}
                              </button>
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                disabled={cancelling === cls.ClassID}
                                className={styles.cancelBtn}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              className={styles.cancelBtn}
                              onClick={() => setConfirmCancelId(cls.ClassID)}
                              disabled={!!cancelling}
                            >
                              Cancel
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {err && (
              <div style={{ color: "red", marginTop: "1rem", fontWeight: "600" }}>
                {err}
              </div>
            )}
            {msg && (
              <div style={{ color: "green", marginTop: "1rem", fontWeight: "600" }}>
                {msg}
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
    </>
  );
}
