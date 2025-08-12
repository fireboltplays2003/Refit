import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import { format, isBefore, isSameDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import styles from "./AddClassView.module.css";
import { useNavigate } from "react-router-dom";

/* ---------- helpers ---------- */

function formatDateDMY(date) {
  return date ? format(date, "dd/MM/yyyy") : "";
}
function formatDateToISO(date) {
  return date ? format(date, "yyyy-MM-dd") : "";
}

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png",
];

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
function parseHourString(hourStr) {
  if (!hourStr) return NaN;
  const [h] = hourStr.split(":");
  return parseInt(h, 10);
}

/* ---------- Portal calendar: fixed to viewport, auto-flip above/below ---------- */
function CalendarPortal({ anchorRef, open, onClose, selected, onSelect }) {
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    function handleDoc(e) {
      const a = anchorRef?.current;
      if (!a) return;
      const t = e.target;
      if (
        open &&
        !a.contains(t) &&
        !document.getElementById("__calendar_portal__")?.contains(t)
      ) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleDoc);
      return () => document.removeEventListener("mousedown", handleDoc);
    }
  }, [open, anchorRef, onClose]);

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return;

    function compute() {
      const rect = anchorRef.current.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const calH = 340; // approx
      const spaceBelow = vh - rect.bottom;
      const spaceAbove = rect.top;

      const placeAbove =
        (spaceAbove > spaceBelow && spaceAbove > 180) ||
        (spaceBelow < calH + 12);

      setPos({
        left: Math.round(rect.left),
        top: placeAbove ? Math.round(rect.top - 6 - calH) : Math.round(rect.bottom + 6),
      });
    }
    compute();

    const onScroll = () => compute();
    const onResize = () => compute();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      id="__calendar_portal__"
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        zIndex: 2147483647,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
        overflow: "hidden",
      }}
    >
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={(d) => {
          onSelect(d);
          onClose();
        }}
        fromDate={new Date()}
        weekStartsOn={0}
        showOutsideDays
      />
    </div>,
    document.body
  );
}

/* ---------- Portal overlay list (hover + keyboard; never under footer) ---------- */
function OverlaySelectPortal({
  anchorRef,
  open,
  onClose,
  value,
  onChange,
  options,
  maxHeight = 300,
}) {
  const [pos, setPos] = useState({
    left: 0,
    top: 0,
    width: 0,
    sizePx: 240,
  });
  const [hoverIdx, setHoverIdx] = useState(-1);
  const listRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return;

    function compute() {
      const rect = anchorRef.current.getBoundingClientRect();
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;

      const itemH = 40;
      const desiredH = Math.min(maxHeight, options.length * itemH);
      const spaceBelow = vh - rect.bottom - 8;
      const spaceAbove = rect.top - 8;

      let top = rect.bottom + 6;
      let sizePx = Math.max(4 * itemH, Math.min(desiredH, spaceBelow));

      if (spaceBelow < desiredH && spaceAbove > spaceBelow) {
        sizePx = Math.max(4 * itemH, Math.min(desiredH, spaceAbove));
        top = rect.top - 6 - sizePx;
        if (top < 8) top = 8;
      }

      setPos({
        left: Math.round(Math.min(Math.max(8, rect.left), vw - rect.width - 8)),
        top: Math.round(top),
        width: Math.round(rect.width),
        sizePx: Math.round(sizePx),
      });
    }

    compute();
    const onScroll = () => compute();
    const onResize = () => compute();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, anchorRef, options.length, maxHeight]);

  useEffect(() => {
    function closeOnOutside(e) {
      const t = e.target;
      if (
        !document.getElementById("__select_portal__")?.contains(t) &&
        !anchorRef?.current?.contains(t)
      ) {
        onClose();
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("mousedown", closeOnOutside);
      document.addEventListener("keydown", onEsc);
      return () => {
        document.removeEventListener("mousedown", closeOnOutside);
        document.removeEventListener("keydown", onEsc);
      };
    }
  }, [open, anchorRef, onClose]);

  useEffect(() => {
    if (!open) return;
    const idx = Math.max(
      0,
      options.findIndex((o) => String(o.value) === String(value))
    );
    setHoverIdx(idx);
    setTimeout(() => listRef.current?.focus(), 0);
  }, [open, options, value]);

  function onKeyDown(e) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHoverIdx((i) => Math.min(options.length - 1, i < 0 ? 0 : i + 1));
      setTimeout(() => {
        const el = document.getElementById(`__opt_${hoverIdx + 1}`);
        el?.scrollIntoView({ block: "nearest" });
      }, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHoverIdx((i) => Math.max(0, i < 0 ? options.length - 1 : i - 1));
      setTimeout(() => {
        const el = document.getElementById(`__opt_${Math.max(0, hoverIdx - 1)}`);
        el?.scrollIntoView({ block: "nearest" });
      }, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[Math.max(0, hoverIdx)];
      if (opt) {
        onChange(opt.value);
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      id="__select_portal__"
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        width: pos.width,
        zIndex: 2147483647,
      }}
    >
      <div
        ref={listRef}
        role="listbox"
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{
          maxHeight: pos.sizePx,
          overflowY: "auto",
          outline: "none",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
          background: "#1f242c",
        }}
      >
        {options.map((opt, i) => {
          const active = String(opt.value) === String(value);
          const hovered = i === hoverIdx;
          return (
            <div
              id={`__opt_${i}`}
              key={String(opt.value)}
              role="option"
              aria-selected={active}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.value);
                onClose();
              }}
              style={{
                height: 40,
                lineHeight: "40px",
                padding: "0 16px",
                cursor: "pointer",
                fontWeight: active ? 700 : 500,
                background: hovered ? "#2b3240" : "transparent",
                color: active ? "#69aaff" : "#e7edf6",
                userSelect: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={opt.label}
            >
              {opt.label}
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

/* -------------------------------------------------------------------- */

export default function AddClassView({ user, setUser }) {
  const [showProfile, setShowProfile] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [classTypes, setClassTypes] = useState([]);
  const [classTypeId, setClassTypeId] = useState("");
  const [date, setDate] = useState(null);
  const [hour, setHour] = useState("");
  const [allClasses, setAllClasses] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const [openWhich, setOpenWhich] = useState(""); // "type" | "hour" | ""

  const typeAnchorRef = useRef(null);
  const hourAnchorRef = useRef(null);
  const dateInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.Role) {
      navigate("/login");
    } else if (user.Role !== "trainer") {
      navigate("/" + user.Role);
    }
  }, [user, navigate]);

  useEffect(() => {
    axios
      .get("/trainer/class-types", { withCredentials: true })
      .then((res) => setClassTypes(res.data))
      .catch(() => setError("Error fetching class types."));
    axios
      .get("/trainer/classes/all", { withCredentials: true })
      .then((res) => setAllClasses(res.data || []))
      .catch(() => setError("Error fetching all classes."));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Generate hours 6..23
  const allHours = [];
  for (let h = 6; h <= 23; h++) allHours.push(`${h}:00`);

  // Booked hours for selected date
  const bookedHoursForDate = new Set();
  if (date) {
    const isoSelectedDate = formatDateToISO(date);
    allClasses.forEach((cls) => {
      if (!cls.Schedule || !cls.time) return;
      const classDate = String(cls.Schedule).slice(0, 10);
      if (classDate === isoSelectedDate) {
        bookedHoursForDate.add(cls.time.slice(0, 5));
      }
    });
  }
  const availableHours = allHours.filter((h) => !bookedHoursForDate.has(h));

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

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
    if (bookedHoursForDate.has(hour)) {
      setError("Selected hour is already booked. Please choose another time.");
      return;
    }

    const selectedDateMidnight = new Date(date);
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
      setError(
        `Cannot create class for this hour or earlier. Current Israel hour is ${israelHour}:00.`
      );
      return;
    }

    axios
      .post(
        "/trainer/create-class",
        {
          classTypeId,
          schedule: formatDateToISO(date),
          time: hour,
        },
        { withCredentials: true }
      )
      .then(() => {
        setSuccess("Class created successfully!");
        setClassTypeId("");
        setDate(null);
        setHour("");
        return axios.get("/trainer/classes/all", { withCredentials: true });
      })
      .then((res) => setAllClasses(res.data || []))
      .catch((err) => {
        if (err.response && err.response.status === 409) {
          setError(
            err.response.data.error ||
              "Another class already exists at this date and time."
          );
        } else {
          setError("Failed to create class.");
        }
      });
  }

  const typeOptions = [
    { value: "", label: "-- Select Class Type --" },
    ...(classTypes || []).map((t) => ({ value: String(t.id), label: t.type })),
  ];
  const hourOptions = [
    { value: "", label: "-- Select Hour --" },
    ...availableHours.map((h) => ({ value: h, label: h })),
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
      <TrainerHeader
        trainer={user}
        setTrainer={setUser}
        onProfile={() => setShowProfile(true)}
      />

      <main className={styles.mainContent}>
        <div className={styles.formContainer}>
          <h2 className={styles.addClassHeader}>Add New Class</h2>

          <form className={styles.addClassForm} onSubmit={handleSubmit} autoComplete="off">
            {/* Class Type */}
            <div>
              <label htmlFor="type">Class Type:</label>
              <div ref={typeAnchorRef}>
                <select
                  id="type"
                  value={classTypeId}
                  onChange={(e) => setClassTypeId(e.target.value)}
                  className={styles.formInputWide}
                  onMouseDown={(e) => {
                    e.preventDefault(); // use our portal, not the native dropdown
                    setOpenWhich("type");
                  }}
                >
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Class Date */}
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
                  onClick={() => setShowCalendar((v) => !v)}
                  autoComplete="off"
                />
              </div>
              <CalendarPortal
                anchorRef={dateInputRef}
                open={showCalendar}
                onClose={() => setShowCalendar(false)}
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setHour("");
                }}
              />
            </div>

            {/* Class Hour */}
            <div>
              <label htmlFor="hour">Class Hour (6:00 to 23:00):</label>
              <div ref={hourAnchorRef}>
                <select
                  id="hour"
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className={styles.formInputWide}
                  disabled={!date}
                  onMouseDown={(e) => {
                    if (!date) return;
                    e.preventDefault();
                    setOpenWhich("hour");
                  }}
                >
                  {hourOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={!opt.value && !date}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {success && <div className={styles.successMsg}>{success}</div>}
            {error && <div className={styles.errorMsg}>{error}</div>}

            <div>
              <button type="submit" className={styles.submitBtn}>
                Confirm
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
      <ProfileModal
        show={showProfile}
        onClose={() => setShowProfile(false)}
        userData={user}
        onUpdate={setUser}
      />

      {/* Overlay select portals (hoverable list) */}
      <OverlaySelectPortal
        anchorRef={typeAnchorRef}
        open={openWhich === "type"}
        onClose={() => setOpenWhich("")}
        value={classTypeId}
        onChange={setClassTypeId}
        options={typeOptions}
      />
      <OverlaySelectPortal
        anchorRef={hourAnchorRef}
        open={openWhich === "hour"}
        onClose={() => setOpenWhich("")}
        value={hour}
        onChange={setHour}
        options={hourOptions}
      />
    </div>
  );
}
