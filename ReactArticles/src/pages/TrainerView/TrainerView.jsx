import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import axios from "axios";
import styles from "./TrainerView.module.css";
import CustomSelect from "../../components/CustomSelect"; // Adjust path accordingly


const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

function toDisplayDate(isoDate) {
  if (!isoDate) return "";
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "Invalid date";
  }
}

function getUpcomingLabel(classDate, classTime) {
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const classDateTime = new Date(classDate + "T" + (classTime || "00:00"));
  const classY = classDateTime.getFullYear();
  const classM = classDateTime.getMonth();
  const classD = classDateTime.getDate();

  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    return weekNo;
  }
  const nowWeek = getWeekNumber(now);
  const classWeek = getWeekNumber(classDateTime);

  if (todayY === classY && todayM === classM && todayD === classD) {
    return "Today";
  } else if (
    classY === todayY &&
    classWeek === nowWeek &&
    classDateTime > now
  ) {
    const diffDays = Math.floor((classDateTime - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 3) return "in 3 days";
    return "This Week";
  } else if (
    (classY === todayY && classWeek === nowWeek + 1) ||
    (classY === todayY + 1 && nowWeek === 52 && classWeek === 1)
  ) {
    return "Next Week";
  } else if (
    (classY > todayY) ||
    (classY === todayY && classM > todayM + 1)
  ) {
    return "Next Month";
  }
  return null;
}

function getLabelColor(lbl) {
  switch (lbl) {
    case "Today":
      return { background: "#93ef87", color: "#1a3120" };
    case "in 3 days":
      return { background: "#ffd966", color: "#715700" };
    case "This Week":
      return { background: "#6ea8ff", color: "#223366" };
    case "Next Week":
      return { background: "#ffcf67", color: "#715700" };
    case "Next Month":
      return { background: "#b6b9c5", color: "#353942" };
    default:
      return { background: "#e0e0e0", color: "#333" };
  }
}

export default function TrainerView({ user, setUser }) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // My Classes (with members)
  const [myClasses, setMyClasses] = useState([]);
  const [loadingMy, setLoadingMy] = useState(true);
  const [filterDateMy, setFilterDateMy] = useState("");
  const [filterTypeMy, setFilterTypeMy] = useState("");
  const [classTypes, setClassTypes] = useState([]);

  // All Upcoming Classes (count, not including self)
  const [allUpcomingClasses, setAllUpcomingClasses] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [filterDateAll, setFilterDateAll] = useState("");
  const [filterTypeAll, setFilterTypeAll] = useState("");

  // Members Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (!user || !user.UserID || user.Role !== "trainer") {
      navigate("/login");
    } else {
      setAuthorized(true);
    }
  }, [user, navigate]);

  // BG animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch class types (for filters)
  useEffect(() => {
    axios
      .get("/trainer/class-types", { withCredentials: true })
      .then(res => setClassTypes(res.data || []))
      .catch(() => setClassTypes([]));
  }, []);

  // Fetch My Classes (with members)
  useEffect(() => {
    if (!user || !user.UserID) return;
    setLoadingMy(true);
    axios
      .get("/trainer/classes-with-members", { withCredentials: true })
      .then(res => {
        const now = new Date();
        const sorted = (res.data || [])
          .filter(cls => {
            const dt = new Date(cls.Schedule + "T" + (cls.time || "00:00"));
            return cls.TrainerID === user.UserID && dt >= now;
          })
          .sort((a, b) => new Date(a.Schedule + "T" + (a.time || "00:00")) - new Date(b.Schedule + "T" + (b.time || "00:00")));
        setMyClasses(sorted);
        setLoadingMy(false);
      })
      .catch(() => {
        setMyClasses([]);
        setLoadingMy(false);
      });
  }, [user]);

  // Fetch All Upcoming Classes (count only, not including self)
  useEffect(() => {
    if (!user || !user.UserID) return;
    setLoadingAll(true);
    axios
      .get("/trainer/all-upcoming-classes-with-count", { withCredentials: true })
      .then(res => {
        const now = new Date();
        const all = (res.data || [])
          .filter(cls => {
            const dt = new Date(cls.Schedule + "T" + (cls.time || "00:00"));
            return cls.TrainerID !== user.UserID && dt >= now;
          })
          .sort((a, b) => new Date(a.Schedule + "T" + (a.time || "00:00")) - new Date(b.Schedule + "T" + (b.time || "00:00")));
        setAllUpcomingClasses(all);
        setLoadingAll(false);
      })
      .catch(() => {
        setAllUpcomingClasses([]);
        setLoadingAll(false);
      });
  }, [user]);

  // Filter logic (matches your MyClasses.jsx)
  function filterList(list, date, type) {
    return list.filter(cls => {
      let match = true;
      if (date) match = match && cls.Schedule === date;
      if (type) match = match && String(cls.ClassType) === String(type);
      return match;
    });
  }

  function openMembersModal(members) {
    setSelectedMembers(members || []);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setSelectedMembers([]);
  }

  if (!authorized) return null;

  return (
    <div className={styles.bgWrapper}>
      <style>{`
        .tv-popupBackdrop {
          position: fixed;
          inset: 0;
          z-index: 3000;
          background: rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tv-membersModal {
          background: #232427;
          border-radius: 18px;
          box-shadow: 0 6px 36px 0 #0009;
          padding: 32px 32px 28px 32px;
          width: 580px;
          max-width: 98vw;
          min-width: 380px;
          margin: 0 auto;
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -60%);
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 4000;
        }
        .tv-membersModalTitle {
          color: #6ea8ff;
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 18px;
        }
        .tv-membersClose {
          position: absolute;
          right: 20px;
          top: 18px;
          font-size: 2.1rem;
          cursor: pointer;
          color: #eee;
          background: none;
          border: none;
        }
        .tv-membersTable {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: none;
          margin-top: 6px;
          font-size: 1.07rem;
        }
        .tv-membersTable th, .tv-membersTable td {
          padding: 10px 7px;
          text-align: left;
        }
        .tv-membersTable th {
          color: #6ea8ff;
          font-size: 1.12rem;
          font-weight: 700;
          border-bottom: 2px solid #32343a;
        }
        .tv-membersTable td {
          border-bottom: 1px solid #2a2a2a;
          color: #f0f0f0;
          word-break: break-all;
        }
        .tv-membersTable td[colspan] {
          text-align: center;
          color: #bbb;
          padding: 24px 0 10px 0;
          font-size: 1.13rem;
        }
        .tv-wideBtn {
          width: 100%;
          font-size: 1.09rem;
          font-weight: 700;
          padding: 7px 0;
          border-radius: 8px;
          background: #6ea8ff;
          color: #232427;
          border: none;
          margin: 0 0 6px 0;
          cursor: pointer;
          display: block;
          text-align: center;
          transition: background 0.13s;
        }
        .tv-wideBtn:hover {
          background: #8dcaff;
        }
        .tv-labelBtn {
          width: 100%;
          font-size: 1.09rem;
          font-weight: 700;
          padding: 7px 0;
          border-radius: 8px;
          border: none;
          margin: 0 0 6px 0;
          display: block;
          text-align: center;
          pointer-events: none;
        }
        .tv-welcomeContainer {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin: 0 0 32px 0;
          padding-left: 14px;
        }
        .tv-welcomeTitle {
          font-size: 2rem;
          font-weight: 800;
          color: #6ea8ff;
          margin-bottom: 3px;
          letter-spacing: 0.2px;
        }
        .tv-highlight {
          color: #ffcf67;
        }
        .tv-welcomeText {
          font-size: 1.11rem;
          color: #bbb;
          margin-bottom: 4px;
        }
        .tv-filtersRow {
          display: flex;
          gap: 20px;
          margin-bottom: 18px;
        }
        .tv-filterGroup {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tv-filterLabel {
          color: #6ea8ff;
          font-weight: 600;
          font-size: 1rem;
          margin-right: 3px;
        }
        .tv-filterDateInput, .tv-filterTypeSelect {
          background: #20232a;
          border: 1px solid #333;
          color: #eee;
          border-radius: 7px;
          padding: 4px 8px;
        }
      `}</style>
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
      <TrainerHeader
        trainer={user}
        setTrainer={setUser}
        onProfile={() => setShowProfile(true)}
      />

      <main className={styles.mainContent}>
        {/* --- Welcome message at top --- */}
        <div className="tv-welcomeContainer">
          <h1 className="tv-welcomeTitle">
            Welcome Back, <span className="tv-highlight">{`${user?.FirstName || ""} ${user?.LastName || ""}`}</span>!
          </h1>
          <p className="tv-welcomeText">
            Here is your dashboard. You can manage your classes, and more.
          </p>
        </div>

        {/* --- My Classes Section --- */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <h2 className={styles.sectionTitle}>My Classes</h2>
            {/* Filters */}
            <div className="tv-filtersRow">
              <div className="tv-filterGroup">
                <label className="tv-filterLabel">Date:</label>
                <input
                  type="date"
                  className="tv-filterDateInput"
                  value={filterDateMy}
                  onChange={e => setFilterDateMy(e.target.value)}
                  max="2099-12-31"
                />
              </div>
              <div className="tv-filterGroup">
                <label className="tv-filterLabel">Type:</label>
                {/* THE SELECT FOR MY CLASSES */}
                <CustomSelect
                  options={[{ value: "", label: "All Types" }, ...classTypes.map(ct => ({ value: ct.id, label: ct.type }))]}
                  value={filterTypeMy}
                  onChange={setFilterTypeMy}
                  placeholder="All Types"
                />
              </div>
            </div>
            {loadingMy ? (
              <div className={styles.loadingMsg}>Loading classes...</div>
            ) : filterList(myClasses, filterDateMy, filterTypeMy).length === 0 ? (
              <div className={styles.noClassesMsg}>
                You have no upcoming classes.
              </div>
            ) : (
              <div className={styles.classListHorizontal}>
                {filterList(myClasses, filterDateMy, filterTypeMy).map(cls => {
                  const lbl = getUpcomingLabel(cls.Schedule, cls.time);
                  const colorStyle = lbl ? getLabelColor(lbl) : {};
                  return (
                    <div className={styles.classCard} key={cls.ClassID}>
                      <div className={styles.classMainInfo}>
                        <span className={styles.classType}>
                          {cls.ClassTypeName || cls.ClassType || "Class"}
                        </span>
                        <span className={styles.classDateTime}>
                          {toDisplayDate(cls.Schedule)} at {cls.time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className={styles.classTrainer}>
                        Trainer: {cls.TrainerFirstName} {cls.TrainerLastName}
                      </div>
                      <div className={styles.classCountBox}>
                        {(typeof cls.Members !== "undefined" && typeof cls.MaxParticipants !== "undefined")
                          ? (
                            <span>
                              {cls.Members.length}/{cls.MaxParticipants > 0 ? cls.MaxParticipants : "?"} booked
                            </span>
                          ) : (
                            <span>?</span>
                          )
                        }
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "14px" }}>
                        <button
                          className="tv-wideBtn"
                          onClick={() => openMembersModal(cls.Members)}
                        >
                          View Members
                        </button>
                        {lbl && (
                          <span
                            className="tv-labelBtn"
                            style={colorStyle}
                          >
                            {lbl}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* --- All Upcoming Classes Section (others) --- */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <h2 className={styles.sectionTitle}>All Upcoming Classes</h2>
            {/* Filters */}
            <div className="tv-filtersRow">
              <div className="tv-filterGroup">
                <label className="tv-filterLabel">Date:</label>
                <input
                  type="date"
                  className="tv-filterDateInput"
                  value={filterDateAll}
                  onChange={e => setFilterDateAll(e.target.value)}
                  max="2099-12-31"
                />
              </div>
              <div className="tv-filterGroup">
                <label className="tv-filterLabel">Type:</label>
                {/* THE SELECT FOR UPCOMING CLASSES */}
                <CustomSelect
                  options={[{ value: "", label: "All Types" }, ...classTypes.map(ct => ({ value: ct.id, label: ct.type }))]}
                  value={filterTypeAll}
                  onChange={setFilterTypeAll}
                  placeholder="All Types"
                />
              </div>
            </div>
            {loadingAll ? (
              <div className={styles.loadingMsg}>Loading classes...</div>
            ) : filterList(allUpcomingClasses, filterDateAll, filterTypeAll).length === 0 ? (
              <div className={styles.noClassesMsg}>
                No upcoming classes.
              </div>
            ) : (
              <div className={styles.classListHorizontal}>
                {filterList(allUpcomingClasses, filterDateAll, filterTypeAll).map(cls => {
                  const lbl = getUpcomingLabel(cls.Schedule, cls.time);
                  const colorStyle = lbl ? getLabelColor(lbl) : {};
                  return (
                    <div className={styles.classCard} key={cls.ClassID}>
                      <div className={styles.classMainInfo}>
                        <span className={styles.classType}>
                          {cls.ClassTypeName || cls.ClassType || "Class"}
                        </span>
                        <span className={styles.classDateTime}>
                          {toDisplayDate(cls.Schedule)} at {cls.time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className={styles.classTrainer}>
                        Trainer: {cls.TrainerFirstName} {cls.TrainerLastName}
                      </div>
                      <div className={styles.classCountBox}>
                        {(typeof cls.bookedCount !== "undefined" && typeof cls.MaxParticipants !== "undefined")
                          ? (
                            <span>
                              {cls.bookedCount}/{cls.MaxParticipants > 0 ? cls.MaxParticipants : "?"} booked
                            </span>
                          ) : (
                            <span>?</span>
                          )
                        }
                      </div>
                      {lbl && (
                        <span
                          className="tv-labelBtn"
                          style={colorStyle}
                        >
                          {lbl}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* MEMBERS MODAL */}
        {modalOpen && (
          <div className="tv-popupBackdrop" onClick={closeModal}>
            <div
              className="tv-membersModal"
              onClick={e => e.stopPropagation()}
            >
              <button className="tv-membersClose" onClick={closeModal}>
                &times;
              </button>
              <div className="tv-membersModalTitle">Class Members</div>
              {selectedMembers && selectedMembers.length > 0 ? (
                <table className="tv-membersTable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMembers.map((m, i) => (
                      <tr key={i}>
                        <td>
                          {m.FirstName} {m.LastName}
                        </td>
                        <td>{m.Email}</td>
                        <td>{m.Phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="tv-membersTable">
                  <tbody>
                    <tr>
                      <td colSpan={3}>No members booked</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
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
