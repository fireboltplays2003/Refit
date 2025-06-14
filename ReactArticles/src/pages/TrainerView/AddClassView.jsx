import { useEffect, useState } from "react";
import axios from "axios";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import styles from "./AddClassView.module.css";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

function getTodayDateString() {
  // Always use local date from browser, not UTC!
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AddClassView({ user, setUser }) {
  const [showProfile, setShowProfile] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [classTypes, setClassTypes] = useState([]);
  const [classTypeId, setClassTypeId] = useState("");
  const [schedule, setSchedule] = useState("");
  const [time, setTime] = useState("");
  const [allClasses, setAllClasses] = useState([]);

  useEffect(() => {
    axios.get("/trainer/class-types", { withCredentials: true })
      .then((res) => setClassTypes(res.data))
      .catch((err) => console.error("Error fetching class types:", err));
    axios.get("/trainer/classes", { withCredentials: true }) // fixed endpoint
      .then((res) => setAllClasses(res.data || []))
      .catch((err) => console.error("Error fetching all classes:", err));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = getTodayDateString();

  function parseTimeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  function isConflict(selectedDate, selectedTime) {
    const selectedMins = parseTimeToMinutes(selectedTime);
    return allClasses.some((cls) => {
      if (!cls.Schedule) return false;
      const classDate = String(cls.Schedule);
      if (classDate !== selectedDate) return false;
      const classTime = cls.time ? cls.time.slice(0, 5) : "";
      if (!classTime) return false;
      const classMins = parseTimeToMinutes(classTime);
      return Math.abs(classMins - selectedMins) < 60;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!user?.UserID) {
      alert("Trainer ID not found. Please log in again.");
      return;
    }
    if (!classTypeId || !schedule || !time) {
      alert("Please fill in all fields.");
      return;
    }
    // Date check
    if (schedule < todayStr) {
      alert("Cannot create a class in the past. Please pick today or a future date.");
      return;
    }
    const [hh, mm] = time.split(":").map(Number);
    if (hh < 6 || hh > 23 || (hh === 23 && mm > 0)) {
      alert("Class time must be between 06:00 and 23:00.");
      return;
    }
    if (isConflict(schedule, time)) {
      alert("A class already exists at this time (±1 hour). Please choose a different time.");
      return;
    }
    axios.post("/trainer/create-class", {
      classTypeId,
      schedule, // Use value from <input type="date" /> directly!
      time
    }, { withCredentials: true })
      .then(() => {
        alert("Class created successfully!");
        setClassTypeId("");
        setSchedule("");
        setTime("");
      })
      .catch((err) => {
        console.error("Error creating class:", err);
        alert("Failed to create class.");
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
        <div className={styles.formContainer}>
          <h2>Add New Class</h2>
          <form className={styles.addClassForm} onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label htmlFor="type">Class Type:</label>
              <select id="type" value={classTypeId} onChange={e => setClassTypeId(e.target.value)}>
                <option value="">-- Select Class Type --</option>
                {classTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date">Class Date:</label>
              <input
                id="date"
                type="date"
                min={todayStr}
                value={schedule}
                onChange={e => setSchedule(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="time">Class Time:</label>
              <input
                id="time"
                type="time"
                min="06:00"
                max="23:00"
                step="900"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
            <div>
              <button type="submit" className={styles.submitBtn}>Confirm</button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
      <ProfileModal show={showProfile} onClose={() => setShowProfile(false)} userData={user} onUpdate={setUser} />
    </div>
  );
}
