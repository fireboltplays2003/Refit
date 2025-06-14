import { useState, useEffect } from "react";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import styles from "./MyClasses.module.css";
import axios from "axios";

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
  "/img/membershipImage.png"
];

export default function MyClasses({ user, setUser }) {
  // Removed showProfile and modalClassName
  const [bgIndex, setBgIndex] = useState(0);
  const [classes, setClasses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchClassesWithMembers();
  }, []);

  function fetchClassesWithMembers() {
    axios.get("/trainer/classes-with-members", { withCredentials: true })
      .then((res) => setClasses(res.data))
      .catch(() => setClasses([]));
  }

  function openMembersModal(className, members) {
    setSelectedMembers(members || []);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedMembers([]);
  }

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
      <TrainerHeader trainer={user} setTrainer={setUser} onProfile={() => {/* profile modal logic here if needed */}} />
      <main className={styles.mainContent}>
        <div className={styles.card}>
          <div className={styles.title}>My Classes</div>
          <div className={styles.underline}></div>
          {classes.length === 0 ? (
            <div className={styles.emptyMsg}>No classes found.</div>
          ) : (
            <ul className={styles.classList}>
              {classes.map(cls => (
                <li key={cls.ClassID} className={styles.classItem}>
                  <div className={styles.classRow}>
                    <div className={styles.classDetails}>
                      <div className={styles.classType}>{cls.ClassTypeName || "Class"}</div>
                      <div className={styles.classDateTime}>
                        {formatDateTime(cls.Schedule, cls.time)}
                      </div>
                    </div>
                    <div className={styles.classActions}>
                      <div className={styles.count}>
                        {(cls.Members ? cls.Members.length : 0)}/{cls.MaxParticipants}
                      </div>
                      <button
                        className={styles.viewBtn}
                        onClick={() => openMembersModal(cls.ClassTypeName || "Class", cls.Members)}
                      >
                        View Members
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {modalOpen && (
          <div className={styles.popupBackdrop} onClick={closeModal}>
            <div className={styles.membersModal} onClick={e => e.stopPropagation()}>
              <button className={styles.membersClose} onClick={closeModal}>&times;</button>
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
                        <td>{m.FirstName} {m.LastName}</td>
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
