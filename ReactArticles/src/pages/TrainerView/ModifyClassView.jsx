import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import { format, isBefore, isSameDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import styles from "./ModifyClassView.module.css";

// Format date for display
function formatDateDMY(date) {
  return date ? format(date, "dd/MM/yyyy") : "";
}

// Format date for backend ISO
function formatDateToISO(date) {
  return date ? format(date, "yyyy-MM-dd") : "";
}

// Format time for display in 'HH:mm'
function formatTime(time) {
  if (!time) return "";
  return time.length > 5 ? time.slice(0, 5) : time;
}

// Get Israel current hour accurately
function getIsraelHour() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    hour12: false,
    hour: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const hourPart = parts.find(p => p.type === "hour");
  return hourPart ? parseInt(hourPart.value, 10) : new Date().getHours();
}

// Parse "HH:mm" string to integer hour
function parseHourString(hourStr) {
  if (!hourStr) return NaN;
  const [h] = hourStr.split(":");
  return parseInt(h, 10);
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
  const [classTypes, setClassTypes] = useState([]);
  const [allClasses, setAllClasses] = useState([]); // Changed to allClasses, not just the trainer's
  const [classes, setClasses] = useState([]); // The trainer's classes only
  const [selectedClassId, setSelectedClassId] = useState("");
  const [form, setForm] = useState({
    classTypeId: "",
    schedule: null,
    time: "",
    maxParticipants: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const dateInputRef = useRef();

  useEffect(() => {
    fetchClasses();
    axios.get("/trainer/class-types", { withCredentials: true })
      .then((res) => setClassTypes(res.data))
      .catch(() => setError("Could not fetch class types."));

    // 👇 GET ALL CLASSES (all trainers)
    axios.get("/trainer/classes/all", { withCredentials: true })
      .then(res => setAllClasses(res.data || []))
      .catch(() => setError("Could not fetch all classes."));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dateInputRef.current && !dateInputRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCalendar]);

  function fetchClasses() {
    axios.get("/trainer/classes", { withCredentials: true })
      .then((res) => setClasses(res.data))
      .catch(() => setError(""));
  }

  // When selectedClassId changes, set form values accordingly
  useEffect(() => {
    if (!selectedClassId) {
      setForm({ classTypeId: "", schedule: null, time: "", maxParticipants: "" });
      return;
    }
    const selected = classes.find(c => c.ClassID === Number(selectedClassId));
    if (selected) {
      setForm({
        classTypeId: selected.ClassType,
        schedule: new Date(selected.Schedule),
        time: formatTime(selected.time),
        maxParticipants: selected.MaxParticipants || ""
      });
    }
  }, [selectedClassId, classes]);

  // Generate all hours 6:00 to 23:00
  const allHours = [];
  for (let h = 6; h <= 23; h++) {
    allHours.push(`${h}:00`);
  }

  // Use ALL classes for hour exclusion, like AddClassView (except the class being edited)
  const bookedHoursForDate = new Set();
  if (form.schedule) {
    const isoSelectedDate = formatDateToISO(form.schedule);
    allClasses.forEach(cls => {
      if (!cls.Schedule || !cls.time) return;
      const classDate = String(cls.Schedule).slice(0, 10);
      // Exclude THIS class (the one we're editing)
      if (classDate === isoSelectedDate && cls.ClassID !== Number(selectedClassId)) {
        bookedHoursForDate.add(cls.time.slice(0, 5));
      }
    });
  }
  const availableHours = allHours.filter(h => !bookedHoursForDate.has(h));

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    clearMessages();

    if (!user?.UserID) {
      setError("Trainer ID not found. Please log in again.");
      return;
    }
    if (!form.classTypeId || !form.schedule || !form.time) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^\d{1,2}:00$/.test(form.time)) {
      setError("Please select a valid hour.");
      return;
    }

    const hourInt = parseHourString(form.time);

    if (hourInt < 6 || hourInt > 23) {
      setError("Class hour must be between 6:00 and 23:00.");
      return;
    }

    // Safety: check if chosen hour is still available
    if (bookedHoursForDate.has(form.time)) {
      setError("Selected hour is already booked. Please choose another time.");
      return;
    }

    const selectedDateMidnight = new Date(form.schedule);
    selectedDateMidnight.setHours(0, 0, 0, 0);

    const now = new Date();
    const israelHour = getIsraelHour();

    const israelNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
    israelNow.setHours(0, 0, 0, 0);

    if (isBefore(selectedDateMidnight, israelNow)) {
      setError("Cannot create a class in the past. Please pick today or a future date.");
      return;
    }

    if (isSameDay(selectedDateMidnight, israelNow) && hourInt <= israelHour) {
      setError(`Cannot create class for this hour or earlier. Current Israel hour is ${israelHour}:00.`);
      return;
    }

    axios.put(`/trainer/class/${selectedClassId}`, {
      classTypeId: form.classTypeId,
      schedule: formatDateToISO(form.schedule),
      time: form.time
    }, { withCredentials: true })
      .then(() => {
        setError("");
        setSuccess("Class updated successfully!");
        fetchClasses();
      })
      .catch(err => {
        setError("Failed to update class: " + (err.response?.data?.error || err.message));
      });
  }

  function handleDelete() {
    if (!selectedClassId) return;
    setError("");
    axios.delete(`/trainer/class/${selectedClassId}`, { withCredentials: true })
      .then(() => {
        setSelectedClassId("");
        setSuccess("Class deleted successfully!");
        fetchClasses();
      })
      .catch(err => {
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
        <div className={styles.formContainer}>
          <h2 className={styles.addClassHeader}>Modify Existing Class</h2>
          <div>
            <label htmlFor="class">Pick a Class:</label>
            <select
              id="class"
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className={styles.formInputWide}
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
            <form className={styles.addClassForm} onSubmit={handleSubmit}>
              <div>
                <label htmlFor="classTypeId">Class Type:</label>
                <select
                  id="classTypeId"
                  value={form.classTypeId}
                  onChange={e => setForm({ ...form, classTypeId: e.target.value })}
                  className={styles.formInputWide}
                >
                  <option value="">-- Select Class Type --</option>
                  {classTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="date">Class Date:</label>
                <div ref={dateInputRef} style={{ position: "relative" }}>
                  <input
                    id="date"
                    type="text"
                    className={`${styles.formInputWide} ${styles.dateInput}`}
                    value={form.schedule ? formatDateDMY(form.schedule) : ""}
                    readOnly
                    placeholder="Select date (dd/mm/yyyy)"
                    onClick={() => setShowCalendar(v => !v)}
                  />
                  {showCalendar && (
                    <div className={styles.calendarPopover}>
                      <DayPicker
                        mode="single"
                        selected={form.schedule}
                        onSelect={selected => {
                          setForm({ ...form, schedule: selected });
                          setShowCalendar(false);
                        }}
                        fromDate={new Date()}
                        showOutsideDays
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="hour">Class Hour (6:00 to 23:00):</label>
                <select
                  id="hour"
                  value={form.time}
                  onChange={e => setForm({ ...form, time: e.target.value })}
                  className={styles.formInputWide}
                  disabled={!form.schedule}
                >
                  <option value="">-- Select Hour --</option>
                  {availableHours.length === 0 && form.schedule && (
                    <option disabled>No available hours on this date</option>
                  )}
                  {availableHours.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              {error && <div className={styles.errorMsg}>{error}</div>}
              {success && <div className={styles.successMsg}>{success}</div>}
              <div>
                <button type="submit" className={styles.submitBtn}>Update Class</button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className={styles.submitBtn}
                >
                  Delete Class
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
      <ProfileModal show={showProfile} onClose={() => setShowProfile(false)} userData={user} onUpdate={setUser} />
    </div>
  );
}
