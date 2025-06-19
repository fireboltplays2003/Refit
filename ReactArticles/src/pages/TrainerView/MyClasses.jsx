import { useState, useEffect } from "react";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import styles from "./MyClasses.module.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// Helper: format to "dd/mm/yyyy HH:MM"
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

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png",
];

export default function MyClasses({ user, setUser }) {
  const [bgIndex, setBgIndex] = useState(0);
  const [allClasses, setAllClasses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [classTypes, setClassTypes] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("");
const navigate = useNavigate();

useEffect(() => {
  if (!user || !user.Role) {
    navigate("/login");
  } else if (user.Role !== "trainer") {
    navigate("/" + user.Role);
  }
}, [user, navigate]);

  // BG
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all classes
  useEffect(() => {
    fetchClassesWithMembers();
    fetchClassTypes();
  }, []);

  function fetchClassesWithMembers() {
    setLoading(true);
    axios
      .get("/trainer/classes-with-members", { withCredentials: true })
      .then((res) => {
        const sorted = (res.data || []).slice().sort((a, b) => {
          const aDate = new Date(`${a.Schedule}T${a.time || "00:00"}`);
          const bDate = new Date(`${b.Schedule}T${b.time || "00:00"}`);
          return aDate - bDate;
        });
        setAllClasses(sorted);
        setLoading(false);
      })
      .catch(() => {
        setAllClasses([]);
        setLoading(false);
      });
  }

  function fetchClassTypes() {
    axios
      .get("/trainer/class-types", { withCredentials: true })
      .then((res) => setClassTypes(res.data || []))
      .catch(() => setClassTypes([]));
  }

  function openMembersModal(className, members) {
    setSelectedMembers(members || []);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedMembers([]);
  }

  // Filter logic
  const now = new Date();

  // Split classes
  const upcomingClasses = allClasses.filter((cls) => {
    const classDateTime = new Date(`${cls.Schedule}T${cls.time || "00:00"}`);
    return classDateTime >= now;
  });
  const historyClasses = allClasses.filter((cls) => {
    const classDateTime = new Date(`${cls.Schedule}T${cls.time || "00:00"}`);
    return classDateTime < now;
  });

  // Apply filters
  function filterList(list) {
    return list.filter((cls) => {
      let match = true;
      // Filter by date
      if (filterDate) {
        // filterDate is yyyy-mm-dd; cls.Schedule is yyyy-mm-dd
        match = match && cls.Schedule === filterDate;
      }
      // Filter by type
      if (filterType) {
        match = match && String(cls.ClassType) === String(filterType);
      }
      return match;
    });
  }

  const displayedClasses =
    activeTab === "upcoming"
      ? filterList(upcomingClasses)
      : filterList(historyClasses);

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
            transition: "opacity 1.2s",
          }}
        />
      ))}
      <div className={styles.overlay} />
      <TrainerHeader
        trainer={user}
        setTrainer={setUser}
        onProfile={() => {}}
      />
      <main className={styles.mainContent}>
        {/* FILTERS ROW */}
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Date:</label>
            <input
              type="date"
              className={styles.filterDateInput}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              max="2099-12-31"
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Type:</label>
            <select
              className={styles.filterTypeSelect}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              {classTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.card}>
          {/* TABS inside card, left side */}
          <div className={styles.tabHeaderRow}>
            <button
              className={`${styles.tabBtn} ${
                activeTab === "upcoming" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("upcoming")}
              type="button"
            >
              My Classes
            </button>
            <button
              className={`${styles.tabBtn} ${
                activeTab === "history" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("history")}
              type="button"
            >
              Class History
            </button>
          </div>
          {/* Card Title */}
          {activeTab === "upcoming" && (
            <div className={styles.title}>My Upcoming Classes</div>
          )}
          {activeTab === "history" && (
            <div className={styles.title}>Class History</div>
          )}
          <div className={styles.underline}></div>
          {loading ? (
            <div className={styles.emptyMsg}>Loading...</div>
          ) : displayedClasses.length === 0 ? (
            <div className={styles.emptyMsg}>No classes found.</div>
          ) : (
            <ul className={styles.classList}>
              {displayedClasses.map((cls) => {
                const currentCount = cls.Members ? cls.Members.length : 0;
                const maxParticipants = cls.MaxParticipants ?? 0;

                const countDisplay =
                  maxParticipants === 0
                    ? "0/0"
                    : `${currentCount}/${maxParticipants}`;

                return (
                  <li key={cls.ClassID} className={styles.classItem}>
                    <div className={styles.classRow}>
                      <div className={styles.classDetails}>
                        <div className={styles.classType}>
                          {cls.ClassTypeName || "Class"}
                        </div>
                        <div className={styles.classDateTime}>
                          {formatDateTime(cls.Schedule, cls.time)}
                        </div>
                      </div>
                      <div className={styles.classActions}>
                        <div className={styles.count}>{countDisplay}</div>
                        <button
                          className={styles.viewBtn}
                          onClick={() =>
                            openMembersModal(
                              cls.ClassTypeName || "Class",
                              cls.Members
                            )
                          }
                        >
                          View Members
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* MEMBERS MODAL */}
        {modalOpen && (
          <div className={styles.popupBackdrop} onClick={closeModal}>
            <div
              className={styles.membersModal}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.membersClose} onClick={closeModal}>
                &times;
              </button>
              <div className={styles.membersModalTitle}>Class Members</div>
              {selectedMembers.length > 0 ? (
                <table className={styles.membersTable}>
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
                <table className={styles.membersTable}>
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
    </div>
  );
}
