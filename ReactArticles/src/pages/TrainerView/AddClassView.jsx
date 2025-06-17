import { useEffect, useState, useRef } from "react";
import axios from "axios";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import { format, isBefore, isSameDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import styles from "./AddClassView.module.css";

// Format date for display
function formatDateDMY(date) {
  return date ? format(date, "dd/MM/yyyy") : "";
}
// Format date for backend ISO
function formatDateToISO(date) {
  return date ? format(date, "yyyy-MM-dd") : "";
}

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

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

export default function AddClassView({ user, setUser }) {
  const [showProfile, setShowProfile] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [classTypes, setClassTypes] = useState([]);
  const [classTypeId, setClassTypeId] = useState("");
  const [date, setDate] = useState(null);
  const [hour, setHour] = useState(""); // string like "6:00"
  const [allClasses, setAllClasses] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const dateInputRef = useRef();
  const successTimeoutRef = useRef();

  useEffect(() => {
    axios.get("/trainer/class-types", { withCredentials: true })
      .then(res => setClassTypes(res.data))
      .catch(() => setError("Error fetching class types."));
    axios.get("/trainer/classes/all", { withCredentials: true }) // Fetch all classes, all trainers
      .then(res => {
        console.log("Fetched classes:", res.data);
        setAllClasses(res.data || []);
      })
      .catch(() => setError("Error fetching all classes."));
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

  // Generate all hours 6:00 to 23:00
  const allHours = [];
  for (let h = 6; h <= 23; h++) {
    allHours.push(`${h}:00`);
  }

  // Filter booked hours for selected date (all trainers)
  const bookedHoursForDate = new Set();

  if (date) {
    const isoSelectedDate = formatDateToISO(date);
    allClasses.forEach(cls => {
      if (!cls.Schedule || !cls.time) return;
      const classDate = String(cls.Schedule).slice(0, 10);
      if (classDate === isoSelectedDate) {
        bookedHoursForDate.add(cls.time.slice(0, 5));
      }
    });
    console.log("Booked hours for", isoSelectedDate, ":", Array.from(bookedHoursForDate));
  }

  // Available hours = all hours minus booked
  const availableHours = allHours.filter(h => !bookedHoursForDate.has(h));

  function clearMessages() {
    setError("");
    setSuccess("");
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
  }

  function handleSubmit(e) {
    e.preventDefault();
    clearMessages();

    if (!user?.UserID) {
      setError("Trainer ID not found. Please log in again.");
      return;
    }
    if (!classTypeId || !date || !hour) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^\d{1,2}:00$/.test(hour)) {
      setError("Please select a valid hour.");
      return;
    }

    const hourInt = parseHourString(hour);

    if (hourInt < 6 || hourInt > 23) {
      setError("Class hour must be between 6:00 and 23:00.");
      return;
    }

    // Safety: check if chosen hour is still available
    if (bookedHoursForDate.has(hour)) {
      setError("Selected hour is already booked. Please choose another time.");
      return;
    }

    const selectedDateMidnight = new Date(date);
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

    axios.post("/trainer/create-class", {
      classTypeId,
      schedule: formatDateToISO(date),
      time: hour
    }, { withCredentials: true })
      .then(() => {
        setError("");
        setSuccess("Class created successfully!");
        setClassTypeId("");
        setDate(null);
        setHour("");
        return axios.get("/trainer/classes/all", { withCredentials: true });
      })
      .then(res => setAllClasses(res.data || []))
      .catch(err => {
        if (err.response && err.response.status === 409) {
          setError(err.response.data.error || "Another class already exists at this date and time.");
        } else {
          setError("Failed to create class.");
        }
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
          <h2 className={styles.addClassHeader}>Add New Class</h2>
          <form className={styles.addClassForm} onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label htmlFor="type">Class Type:</label>
              <select
                id="type"
                value={classTypeId}
                onChange={e => setClassTypeId(e.target.value)}
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
                  value={date ? formatDateDMY(date) : ""}
                  readOnly
                  placeholder="Select date (dd/mm/yyyy)"
                  onClick={() => setShowCalendar(v => !v)}
                  autoComplete="off"
                />
                {showCalendar && (
                  <div className={styles.calendarPopover}>
                    <DayPicker
                      mode="single"
                      selected={date}
                      onSelect={selected => {
                        setDate(selected);
                        setShowCalendar(false);
                        setHour(""); // clear hour when date changes
                      }}
                      fromDate={new Date()}
                      weekStartsOn={0}
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
                value={hour}
                onChange={e => setHour(e.target.value)}
                className={styles.formInputWide}
                disabled={!date}
              >
                <option value="">-- Select Hour --</option>
                {availableHours.length === 0 && date && (
                  <option disabled>No available hours on this date</option>
                )}
                {availableHours.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {success && <div className={styles.successMsg}>{success}</div>}
            {error && <div className={styles.errorMsg}>{error}</div>}

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
