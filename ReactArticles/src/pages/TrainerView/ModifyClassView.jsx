import { useState, useEffect } from "react";
import axios from "axios";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import styles from "./ModifyClassView.module.css";

// Show for select as dd/mm/yyyy
function formatDateDMY(sqlDate) {
  if (!sqlDate) return "";
  const [yyyy, mm, dd] = String(sqlDate).slice(0, 10).split("-");
  return `${dd}/${mm}/${yyyy}`;
}
function formatDate(sqlDate) {
  // yyyy-mm-dd for form
  return sqlDate ? String(sqlDate).slice(0, 10) : "";
}
function formatTime(sqlTime) {
  if (!sqlTime) return "";
  return sqlTime.length > 5 ? sqlTime.slice(0, 5) : sqlTime;
}

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

export default function ModifyClassView({ user, setUser }) {
  const [showProfile, setShowProfile] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  const [classes, setClasses] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [form, setForm] = useState({
    classTypeId: "",
    schedule: "",
    time: "",
    maxParticipants: ""
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchClasses();
    axios.get("/trainer/class-types", { withCredentials: true })
      .then((res) => setClassTypes(res.data))
      .catch(() => setError("Could not fetch class types."));
  }, []);

  function fetchClasses() {
    axios.get("/trainer/classes", { withCredentials: true })
      .then((res) => setClasses(res.data))
      .catch(() => setError("Could not fetch classes."));
  }

  useEffect(() => {
    if (!selectedClassId) {
      setForm({ classTypeId: "", schedule: "", time: "", maxParticipants: "" });
      return;
    }
    const selected = classes.find(c => c.ClassID === Number(selectedClassId));
    if (selected) {
      setForm({
        classTypeId: selected.ClassType,
        schedule: formatDate(selected.Schedule), // for <input type=date>
        time: formatTime(selected.time),
        maxParticipants: selected.MaxParticipants
      });
    }
  }, [selectedClassId, classes]);
  
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!selectedClassId) return;
    const original = classes.find(c => c.ClassID === Number(selectedClassId));
    if (!original) {
      setError("Original class data not found.");
      return;
    }
    const isSame =
      String(form.classTypeId) === String(original.ClassType) &&
      (form.schedule === formatDate(original.Schedule)) &&
      (form.time === formatTime(original.time));
    if (isSame) {
      setError("No changes detected. Modify at least one field to update.");
      return;
    }
    await axios.put(
      `/trainer/class/${selectedClassId}`,
      {
        classTypeId: form.classTypeId,
        schedule: form.schedule,
        time: form.time
      },
      { withCredentials: true }
    )
      .then(() => {
        alert("Class updated!");
        fetchClasses();
      })
      .catch((err) => {
        setError("Failed to update class: " + (err.response?.data?.error || err.message));
      });
  }

  async function handleDelete() {
    if (!selectedClassId) return;
    if (!window.confirm("Are you sure you want to delete this class? This action cannot be undone.")) return;
    setError("");
    await axios.delete(`/trainer/class/${selectedClassId}`, { withCredentials: true })
      .then(() => {
        alert("Class deleted!");
        setSelectedClassId("");
        fetchClasses();
      })
      .catch((err) => {
        setError("Failed to delete class: " + (err.response?.data?.error || err.message));
      });
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
      <TrainerHeader trainer={user} setTrainer={setUser} onProfile={() => setShowProfile(true)} />
      <main className={styles.mainContent}>
        <div className={styles.modifyClassContainer}>
          <h2 className={styles.modifyClassHeader}>Modify Existing Class</h2>
          {error && <div className={styles.errorMsg}>{error}</div>}
          <div>
            <label className={styles.formLabel}>Pick a Class:</label>
            <select
              className={styles.formInput}
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
            >
              <option value="">-- Select Class --</option>
              {classes.map(cls => (
                <option key={cls.ClassID} value={cls.ClassID}>
                  {cls.ClassTypeName || `TypeID ${cls.ClassType}`} - {formatDateDMY(cls.Schedule)} {formatTime(cls.time)}
                </option>
              ))}
            </select>
          </div>
          {selectedClassId && (
            <form className={styles.modifyClassForm} onSubmit={handleSubmit}>
              <div>
                <label className={styles.formLabel}>Class Type:</label>
                <select
                  className={`${styles.formInput} ${styles.formSelect}`}
                  name="classTypeId"
                  value={form.classTypeId}
                  onChange={handleChange}
                >
                  <option value="">-- Select Class Type --</option>
                  {classTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.formLabel}>Class Date:</label>
                <input
                  className={styles.formInput}
                  type="date"
                  name="schedule"
                  value={form.schedule}
                  min={getTodayDateString()}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Class Time:</label>
                <input
                  className={styles.formInput}
                  type="time"
                  name="time"
                  value={formatTime(form.time)}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formBtnRow}>
                <button type="submit" className={styles.updateBtn}>Update Class</button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className={styles.deleteBtn}
                >
                  Delete Class
                </button>
              </div>
            </form>
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

// Helper for today's date (browser local, not UTC)
function getTodayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
