import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import { format, isBefore, isSameDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import styles from "./ModifyClassView.module.css";
import { useNavigate } from "react-router-dom";

/* ---------- helpers ---------- */

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
  const hourPart = parts.find((p) => p.type === "hour");
  return hourPart ? parseInt(hourPart.value, 10) : new Date().getHours();
}
// Parse "HH:mm" string to integer hour
function parseHourString(hourStr) {
  if (!hourStr) return NaN;
  const [h] = hourStr.split(":");
  return parseInt(h, 10);
}
/** Keep only future classes (Israel time) */
function isFutureClassJerusalem(cls) {
  if (!cls?.Schedule) return false;
  const nowIL = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
  const todayIL = new Date(nowIL);
  todayIL.setHours(0, 0, 0, 0);

  const classDate = new Date(cls.Schedule);
  const classDay = new Date(classDate);
  classDay.setHours(0, 0, 0, 0);

  if (classDay > todayIL) return true;
  if (classDay < todayIL) return false;

  const hour = parseHourString(formatTime(cls.time));
  const currentILHour = getIsraelHour();
  return !Number.isNaN(hour) && hour > currentILHour;
}

/* ---------- scrollable, hoverable dropdown with PORTAL MENU ---------- */
function SimpleDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const wrapRef = useRef(null);

  // NEW: ref to the portal menu so inside clicks don't count as "outside"
  const menuRef = useRef(null); // <— added

  const [menuPos, setMenuPos] = useState({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  useEffect(() => {
    function onDocMouseDown(e) {
      // if click is inside control wrapper OR inside the portal menu => ignore
      if (wrapRef.current && wrapRef.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return; // <— added
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Recompute menu position when opening or on resize/scroll
  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;

    function compute() {
      const ctrl = wrapRef.current.querySelector("[data-dd-control]");
      if (!ctrl) return;

      const rect = ctrl.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const menuHeight = 240; // must match maxHeight below
      const spaceBelow = viewportH - rect.bottom;
      const placeAbove = spaceBelow < menuHeight + 12; // 12px gap

      setMenuPos({
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        top: placeAbove ? Math.round(rect.top - 6 - menuHeight) : Math.round(rect.bottom + 6),
        placeAbove,
      });
    }

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(document.documentElement);

    function onScroll() { compute(); }
    function onResize() { compute(); }
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [open]);

  const selectedLabel = value
    ? options.find(o => String(o.value) === String(value))?.label
    : "";

  const BLUE = "#5BBAFF";

  const ui = {
    wrap: {
      position: "relative",
      width: "100%",
      // Do NOT set z-index here; portal solves stacking/footers
    },
    control: {
      width: "100%",
      height: 56,
      borderRadius: 14,
      background: "#232a36",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "0 48px 0 20px",
      fontSize: "1.25rem",
      fontWeight: 600,
      color: "#69aaff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      outline: "none",
    },
    caret: {
      position: "absolute",
      right: 16,
      top: "50%",
      transform: "translateY(-50%)",
      borderLeft: "6px solid transparent",
      borderRight: "6px solid transparent",
      borderTop: `8px solid ${BLUE}`,
      pointerEvents: "none",
    },
    // Portal menu: fixed to viewport so it stays above footer
    menuFixed: {
      position: "fixed",
      left: menuPos.left,
      top: menuPos.top,
      width: menuPos.width,
      background: "#232427",
      border: "1px solid #2f3542",
      borderRadius: 12,
      boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
      maxHeight: 240,
      overflowY: "auto",
      zIndex: 2147483647, // maximum practical
    },
    opt: ({ active, hovered, placeholder }) => ({
      padding: "12px 16px",
      cursor: "pointer",
      fontSize: "1.1rem",
      fontWeight: active ? 700 : 500,
      background: placeholder
        ? BLUE
        : (active || hovered) ? BLUE : "transparent",
      color: (placeholder || active || hovered) ? "#232427" : "#e8eef8",
    }),
    placeholderText: { color: "#8aa8c6" },
    flipTip: {
      position: "fixed",
      left: menuPos.left + menuPos.width - 18,
      top: menuPos.placeAbove ? menuPos.top + 6 : menuPos.top - 14,
      fontSize: 10,
      opacity: 0.7,
      userSelect: "none",
    }
  };

  return (
    <div ref={wrapRef} style={ui.wrap}>
      <button
        type="button"
        style={ui.control}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-dd-control
      >
        <span style={!selectedLabel ? ui.placeholderText : undefined}>
          {selectedLabel || placeholder}
        </span>
      </button>
      <span style={ui.caret} />
      {open && createPortal(
        <>
          {/* NEW: attach ref to the menu */}
          <div ref={menuRef} style={ui.menuFixed} role="listbox">
            {options.map((o, i) => {
              const active = String(o.value) === String(value);
              const isPlaceholder = String(o.value) === "";
              const hovered = hoverIdx === i;
              return (
                <div
                  key={String(o.value) + i}
                  role="option"
                  aria-selected={active}
                  style={ui.opt({ active, hovered, placeholder: isPlaceholder })}
                  // IMPORTANT: select on mouse down and stop propagation so the outside mousedown doesn't close before selection
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onChange(o.value);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(-1)}
                >
                  {o.label}
                </div>
              );
            })}
          </div>
          {/* <div style={ui.flipTip}>{menuPos.placeAbove ? "▲" : "▼"}</div> */}
        </>,
        document.body
      )}
    </div>
  );
}
/* -------------------------------------------------------------------- */

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png",
];

export default function ModifyClassView({ user, setUser }) {
  const [showProfile, setShowProfile] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  const [classTypes, setClassTypes] = useState([]);
  const [allClasses, setAllClasses] = useState([]);   // all trainers (for hour collision)
  const [classes, setClasses] = useState([]);         // this trainer (dropdown)

  const [selectedClassId, setSelectedClassId] = useState("");
  const [form, setForm] = useState({
    classTypeId: "",
    schedule: null,
    time: "",
    maxParticipants: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const dateInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.Role) {
      navigate("/login");
    } else if (user.Role !== "trainer") {
      navigate("/" + user.Role);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchClasses();

    axios
      .get("/trainer/class-types", { withCredentials: true })
      .then((res) => setClassTypes(res.data))
      .catch(() => setError("Could not fetch class types."));

    // get ALL classes (any trainer) used for hour-collision, but keep only future
    axios
      .get("/trainer/classes/all", { withCredentials: true })
      .then((res) => setAllClasses((res.data || []).filter(isFutureClassJerusalem)))
      .catch(() => setError("Could not fetch all classes."));
  }, []);

  function fetchClasses() {
    axios
      .get("/trainer/classes", { withCredentials: true })
      .then((res) => {
        const futureOnly = (res.data || []).filter(isFutureClassJerusalem);
        setClasses(futureOnly);
      })
      .catch(() => setError(""));
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % images.length);
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

  // When selectedClassId changes, set form values accordingly
  useEffect(() => {
    if (!selectedClassId) {
      setForm({ classTypeId: "", schedule: null, time: "", maxParticipants: "" });
      return;
    }
    const selected = classes.find((c) => c.ClassID === Number(selectedClassId));
    if (selected) {
      setForm({
        classTypeId: selected.ClassType,
        schedule: new Date(selected.Schedule),
        time: formatTime(selected.time),
        maxParticipants: selected.MaxParticipants || "",
      });
    }
  }, [selectedClassId, classes]);

  // Generate all hours 06:00 to 23:00 (zero-padded)
  const allHours = [];
  for (let h = 6; h <= 23; h++) {
    allHours.push(`${String(h).padStart(2, "0")}:00`); // <— zero-pad
  }

  // build hour-collision set from *future* classes only
  const bookedHoursForDate = new Set();
  if (form.schedule) {
    const isoSelectedDate = formatDateToISO(form.schedule);
    allClasses.forEach((cls) => {
      if (!cls.Schedule || !cls.time) return;
      const classDate = String(cls.Schedule).slice(0, 10);
      if (classDate === isoSelectedDate && cls.ClassID !== Number(selectedClassId)) {
        bookedHoursForDate.add(cls.time.slice(0, 5)); // already HH:mm
      }
    });
  }
  const availableHours = allHours.filter((h) => !bookedHoursForDate.has(h));

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

    if (!/^\d{2}:\d{2}$/.test(form.time)) { // <— stricter HH:mm
      setError("Please select a valid hour.");
      return;
    }

    const hourInt = parseHourString(form.time);

    if (hourInt < 6 || hourInt > 23) {
      setError("Class hour must be between 6:00 and 23:00.");
      return;
    }

    if (bookedHoursForDate.has(form.time)) {
      setError("Selected hour is already booked. Please choose another time.");
      return;
    }

    const selectedDateMidnight = new Date(form.schedule);
    selectedDateMidnight.setHours(0, 0, 0, 0);

    const now = new Date();
    const israelHour = getIsraelHour();

    const israelNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })
    );
    israelNow.setHours(0, 0, 0, 0);

    if (isBefore(selectedDateMidnight, israelNow)) {
      setError("Cannot create a class in the past. Please pick today or a future date.");
      return;
    }

    if (isSameDay(selectedDateMidnight, israelNow) && hourInt <= israelHour) {
      setError(`Cannot create class for this hour or earlier. Current Israel hour is ${israelHour}:00.`);
      return;
    }

    axios
      .put(
        `/trainer/class/${selectedClassId}`,
        {
          classTypeId: form.classTypeId,
          schedule: formatDateToISO(form.schedule),
          time: form.time,
        },
        { withCredentials: true }
      )
      .then(() => {
        setError("");
        setSuccess("Class updated successfully!");
        fetchClasses();
      })
      .catch((err) => {
        setError("Failed to update class: " + (err.response?.data?.error || err.message));
      });
  }

  function handleDelete() {
    if (!selectedClassId) return;
    setError("");
    axios
      .delete(`/trainer/class/${selectedClassId}`, { withCredentials: true })
      .then(() => {
        setSelectedClassId("");
        setSuccess("Class deleted successfully!");
        fetchClasses();
      })
      .catch((err) => {
        setError("Failed to delete class: " + (err.response?.data?.error || err.message));
      });
  }

  // Build options for the scrollable dropdown
  const classOptions = [
    { value: "", label: "-- Select Class --" },
    ...classes.map(cls => ({
      value: String(cls.ClassID),
      label: `${cls.ClassTypeName || `TypeID ${cls.ClassType}`} - ${formatDateDMY(cls.Schedule)} ${formatTime(cls.time)}`
    })),
  ];

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
      <TrainerHeader trainer={user} setTrainer={setUser} onProfile={() => setShowProfile(true)} />
      <main className={styles.mainContent}>
        {/* If your footer is fixed, padding-bottom helps avoid overlap while scrolling the page */}
        <div className={styles.formContainer} style={{ overflow: "visible", position: "relative", zIndex: 2, paddingBottom: 24 }}>
          <h2 className={styles.addClassHeader}>Modify Existing Class</h2>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="class">Pick a Class:</label>
            <div style={{ marginTop: 6 }}>
              <SimpleDropdown
                value={selectedClassId}
                onChange={setSelectedClassId}
                options={classOptions}
                placeholder="-- Select Class --"
              />
            </div>
          </div>

          {selectedClassId && (
            <form className={styles.addClassForm} onSubmit={handleSubmit}>
              <div>
                <label htmlFor="classTypeId">Class Type:</label>
                <select
                  id="classTypeId"
                  value={form.classTypeId}
                  onChange={(e) => setForm({ ...form, classTypeId: e.target.value })}
                  className={styles.formInputWide}
                >
                  <option value="">-- Select Class Type --</option>
                  {classTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.type}
                    </option>
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
                    onClick={() => setShowCalendar((v) => !v)}
                  />
                  {showCalendar && (
                    <div className={styles.calendarPopover}>
                      <DayPicker
                        mode="single"
                        selected={form.schedule}
                        onSelect={(selected) => {
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
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className={styles.formInputWide}
                  disabled={!form.schedule}
                >
                  <option value="">-- Select Hour --</option>
                  {availableHours.length === 0 && form.schedule && (
                    <option disabled>No available hours on this date</option>
                  )}
                  {availableHours.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {error && <div className={styles.errorMsg}>{error}</div>}
              {success && <div className={styles.successMsg}>{success}</div>}

              <div>
                <button type="submit" className={styles.submitBtn}>
                  Update Class
                </button>
                <button type="button" onClick={handleDelete} className={styles.submitBtn}>
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
