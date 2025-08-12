import { useState, useEffect, useRef } from "react";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import styles from "./MyClasses.module.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* ---------- Simple, self-contained dropdown (scrolling + hover; 1:1 look) ---------- */
function SimpleDropdown({
  value,
  onChange,
  options,                 // [{ value, label }]
  headerText = "All Types" // clickable header to clear (value = "")
}) {
  const [open, setOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedLabel =
    options.find(o => String(o.value) === String(value))?.label || headerText;

  const uiBlue = "#6ea8ff";

  const ui = {
    wrap: { position: "relative", width: "100%", zIndex: 50 },
    control: {
      width: "100%",
      height: 56,
      borderRadius: 14,
      background: "#232a36",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "0 48px 0 22px",
      fontSize: "1.22rem",
      fontWeight: 700,
      color: uiBlue,
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
      borderTop: `8px solid ${uiBlue}`,
      pointerEvents: "none",
    },
    menu: {
      position: "absolute",
      left: 0,
      top: "calc(100% + 6px)",
      width: "100%",
      background: "#232427",
      border: "1px solid #2f3542",
      borderRadius: 12,
      boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
      maxHeight: 320,         // scrolling
      overflowY: "auto",
    },
    header: {
      padding: "14px 16px",
      background: uiBlue,
      color: "#0e1621",
      fontWeight: 800,
      fontSize: "1.12rem",
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      cursor: "pointer",
      userSelect: "none",
    },
    opt: (active, hovered) => ({
      padding: "14px 16px",
      cursor: "pointer",
      fontSize: "1.14rem",
      fontWeight: active ? 700 : 500,
      background: active ? uiBlue : hovered ? "#2b3246" : "transparent",
      color: active ? "#232427" : "#e8eef8",
      transition: "background 120ms ease",
      userSelect: "none",
    }),
  };

  return (
    <div ref={wrapRef} style={ui.wrap}>
      <button
        type="button"
        style={ui.control}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedLabel}</span>
      </button>
      <span style={ui.caret} />
      {open && (
        <div style={ui.menu} role="listbox">
          {/* clickable header (clears to "All Types") */}
          <div
            style={ui.header}
            onMouseDown={(e) => { e.preventDefault(); onChange(""); setOpen(false); }}
          >
            {headerText}
          </div>
          {options.map((o, i) => {
            const active = String(o.value) === String(value);
            const hovered = i === hoverIdx;
            return (
              <div
                key={String(o.value)}
                role="option"
                aria-selected={active}
                style={ui.opt(active, hovered)}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(-1)}
                onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setOpen(false); }}
                title={o.label}
              >
                {o.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
/* --------------------------------------------------------------------- */

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
    if (!user || !user.Role) navigate("/login");
    else if (user.Role !== "trainer") navigate("/" + user.Role);
  }, [user, navigate]);

  // BG cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  function openMembersModal(_className, members) {
    setSelectedMembers(members || []);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setSelectedMembers([]);
  }

  const now = new Date();
  const upcomingClasses = allClasses.filter((cls) => {
    const dt = new Date(`${cls.Schedule}T${cls.time || "00:00"}`);
    return dt >= now;
  });
  const historyClasses = allClasses.filter((cls) => {
    const dt = new Date(`${cls.Schedule}T${cls.time || "00:00"}`);
    return dt < now;
  });

  function filterList(list) {
    return list.filter((cls) => {
      let match = true;
      if (filterDate) match = match && cls.Schedule === filterDate;
      if (filterType) match = match && String(cls.ClassType) === String(filterType);
      return match;
    });
  }

  const displayedClasses =
    activeTab === "upcoming" ? filterList(upcomingClasses) : filterList(historyClasses);

  // No duplicate "All Types" — header clears filter.
  const typeOptions = classTypes.map((t) => ({ value: String(t.id), label: t.type }));

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
      <TrainerHeader trainer={user} setTrainer={setUser} onProfile={() => {}} />

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

          {/* Type filter — uses CSS hooks you added */}
          <div className={`${styles.filterGroup} ${styles.typeFilterGroup}`}>
            <label className={styles.filterLabel}>Type:</label>
            <div className={styles.typeFilterContainer}>
              <SimpleDropdown
                value={filterType}
                onChange={setFilterType}
                options={typeOptions}
                headerText="All Types"
              />
            </div>
          </div>
        </div>

        <div className={styles.card}>
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

          {activeTab === "upcoming" && <div className={styles.title}>My Upcoming Classes</div>}
          {activeTab === "history" && <div className={styles.title}>Class History</div>}
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
                const countDisplay = maxParticipants === 0 ? "0/0" : `${currentCount}/${maxParticipants}`;

                return (
                  <li key={cls.ClassID} className={styles.classItem}>
                    <div className={styles.classRow}>
                      <div className={styles.classDetails}>
                        <div className={styles.classType}>{cls.ClassTypeName || "Class"}</div>
                        <div className={styles.classDateTime}>
                          {formatDateTime(cls.Schedule, cls.time)}
                        </div>
                      </div>
                      <div className={styles.classActions}>
                        <div className={styles.count}>{countDisplay}</div>
                        <button
                          className={styles.viewBtn}
                          onClick={() =>
                            openMembersModal(cls.ClassTypeName || "Class", cls.Members)
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
            <div className={styles.membersModal} onClick={(e) => e.stopPropagation()}>
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
