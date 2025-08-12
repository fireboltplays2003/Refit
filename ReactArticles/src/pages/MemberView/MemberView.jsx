import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MemberView.module.css";
import MemberHeader from "./MemberHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import axios from "axios";

/* ---------------- simple, self-contained scrollable dropdown (like trainer) ---------------- */
function SimpleDropdown({ value, onChange, options, placeholder = "-- All Types --" }) {
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
    value && options.find(o => String(o.value) === String(value))?.label;

  const uiBlue = "#6ea8ff";
  const ui = {
    wrap: { position: "relative", width: "100%", zIndex: 50 },
    control: {
      width: "100%", height: 48,
      borderRadius: 12,
      background: "#232a36",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "0 48px 0 16px",
      fontSize: "1.05rem", fontWeight: 700, color: uiBlue,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      cursor: "pointer", outline: "none",
    },
    caret: {
      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
      borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
      borderTop: `8px solid ${uiBlue}`, pointerEvents: "none",
    },
    menu: {
      position: "absolute", left: 0, top: "calc(100% + 6px)", width: "100%",
      background: "#232427", border: "1px solid #2f3542", borderRadius: 12,
      boxShadow: "0 12px 28px rgba(0,0,0,0.45)", maxHeight: 260, overflowY: "auto",
    },
    opt: (active, hovered) => ({
      padding: "12px 14px", cursor: "pointer",
      fontSize: "1.05rem", fontWeight: active ? 800 : 600,
      background: active ? uiBlue : hovered ? "#2b3246" : "transparent",
      color: active ? "#232427" : "#e8eef8",
      transition: "background 120ms ease",
      userSelect: "none",
    }),
    placeholder: { color: uiBlue, fontWeight: 700 },
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
        <span style={!selectedLabel ? ui.placeholder : undefined}>
          {selectedLabel || placeholder}
        </span>
      </button>
      <span style={ui.caret} />
      {open && (
        <div style={ui.menu} role="listbox">
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
                onClick={() => { onChange(o.value); setOpen(false); }}
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
/* ------------------------------------------------------------------------------------------------ */

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

  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    return weekNo;
  }
  const nowWeek = getWeekNumber(now);
  const classWeek = getWeekNumber(classDateTime);

  if (todayY === classDateTime.getFullYear() &&
      todayM === classDateTime.getMonth() &&
      todayD === classDateTime.getDate()) return "Today";
  if (classDateTime.getFullYear() === todayY && classWeek === nowWeek && classDateTime > now) return "This Week";
  if ((classDateTime.getFullYear() === todayY && classWeek === nowWeek + 1) ||
      (classDateTime.getFullYear() === todayY + 1 && nowWeek === 52 && classWeek === 1)) return "Next Week";
  return null;
}

export default function MemberView({ user, setUser }) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const [classes, setClasses] = useState([]);
  const [fetchingClasses, setFetchingClasses] = useState(true);

  const [allUpcomingClasses, setAllUpcomingClasses] = useState([]);
  const [loadingAllUpcoming, setLoadingAllUpcoming] = useState(true);

  const [membership, setMembership] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [attendance, setAttendance] = useState(0);

  // NEW: class types for the dropdowns
  const [classTypes, setClassTypes] = useState([]);

  // NEW: per-section filters (date + type)
  const [upcDate, setUpcDate] = useState("");      // yyyy-mm-dd
  const [upcType, setUpcType] = useState("");      // type name value
  const [allDate, setAllDate] = useState("");
  const [allType, setAllType] = useState("");
  const [histDate, setHistDate] = useState("");
  const [histType, setHistType] = useState("");

  useEffect(() => {
    if (!user || !user.Role) {
      navigate("/login");
    } else if (user.Role !== "member") {
      navigate("/" + user.Role);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !user.Role) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setLoading(false);
    if (user.Role !== "member") {
      navigate("/" + user.Role);
    } else {
      setAuthorized(true);
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // fetch user's booked classes
  useEffect(() => {
    if (!authorized) return;
    setFetchingClasses(true);
    axios.get("/member/my-booked-classes", { withCredentials: true })
      .then(res => res.data)
      .then(data => {
        setClasses(Array.isArray(data) ? data : []);
        setAttendance(Array.isArray(data) ? data.filter(cls => {
          const classDateTime = new Date(cls.Schedule + "T" + (cls.time || "00:00"));
          return classDateTime < new Date();
        }).length : 0);
        setFetchingClasses(false);
      })
      .catch(() => {
        setClasses([]);
        setAttendance(0);
        setFetchingClasses(false);
      });
  }, [authorized]);

  // fetch all upcoming classes (gym)
  useEffect(() => {
    if (!authorized) return;
    setLoadingAllUpcoming(true);
    axios.get("/member/all-upcoming-classes-with-count", { withCredentials: true })
      .then(res => res.data)
      .then(data => {
        setAllUpcomingClasses(Array.isArray(data) ? data : []);
        setLoadingAllUpcoming(false);
      })
      .catch(() => {
        setAllUpcomingClasses([]);
        setLoadingAllUpcoming(false);
      });
  }, [authorized]);

  // membership
  useEffect(() => {
    if (!authorized) return;
    setMembershipLoading(true);
    axios.get("/member/my-membership", { withCredentials: true })
      .then(res => res.data)
      .then(data => {
        setMembership(data || null);
        setMembershipLoading(false);
      })
      .catch(() => {
        setMembership(null);
        setMembershipLoading(false);
      });
  }, [authorized]);

  // NEW: fetch class types for dropdown options
  useEffect(() => {
    if (!authorized) return;
    axios.get("/member/class-types", { withCredentials: true })
      .then(res => setClassTypes(res.data || []))
      .catch(() => setClassTypes([]));
  }, [authorized]);

  if (loading) {
    return (
      <div className={styles.bgWrapper} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ color: "#fff", fontSize: "2rem" }}>Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    navigate("/login");
    return null;
  }

  const now = new Date();
  const upcomingClasses = [];
  const pastClasses = [];
  classes.forEach(cls => {
    const classDateTime = new Date(cls.Schedule + "T" + (cls.time || "00:00"));
    if (classDateTime >= now) {
      upcomingClasses.push(cls);
    } else {
      pastClasses.push(cls);
    }
  });
  upcomingClasses.sort((a, b) => new Date(a.Schedule + "T" + (a.time || "00:00")) - new Date(b.Schedule + "T" + (b.time || "00:00")));
  pastClasses.sort((a, b) => new Date(b.Schedule + "T" + (b.time || "00:00")) - new Date(a.Schedule + "T" + (a.time || "00:00")));

  let daysLeft = null;
  if (membership && membership.StartDate && membership.EndDate) {
    const end = new Date(membership.EndDate);
    const today = new Date();
    end.setHours(0,0,0,0); today.setHours(0,0,0,0);
    daysLeft = Math.max(0, Math.round((end - today) / (1000 * 60 * 60 * 24)));
  }

  // --- type options (value = readable name to match cls.ClassType/Name strings) ---
  const typeOptions = [
    { value: "", label: "-- All Types --" },
    ...(classTypes || []).map(t => {
      const label = t.type || t.ClassType || String(t.id);
      return { value: label, label };
    }),
  ];

  // --- helpers to apply per-section filters ---
  const applyFilters = (list, dateVal, typeVal) =>
    list.filter(cls => {
      let ok = true;
      if (dateVal) ok = ok && (cls.Schedule === dateVal);
      if (typeVal) {
        const typeStr = String(cls.ClassTypeName || cls.ClassType || "");
        ok = ok && (typeStr === String(typeVal));
      }
      return ok;
    });

  const filteredUpcoming = applyFilters(upcomingClasses, upcDate, upcType);
  const filteredAllUpcoming = applyFilters(allUpcomingClasses, allDate, allType);
  const filteredHistory = applyFilters(pastClasses, histDate, histType);

  // small inline styles for the filter layout only
  const row = {
    display: "flex", gap: "1rem", alignItems: "center",
    flexWrap: "wrap", margin: "0.4rem 0 0.8rem 0"
  };
  const label = { color: "#bfc5ce", fontWeight: 700, fontSize: "1rem" };
  const dateInput = {
    width: 250, maxWidth: 270, height: 48, borderRadius: 12,
    border: "1px solid #333", background: "#232436", color: "#69aaff",
    padding: "0 16px", fontSize: "1.05rem", fontWeight: 600, outline: "none"
  };

  return (
    <>
      <MemberHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />
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
        <main className={styles.mainContent}>

          {/* --- TOP BAR ROW (unchanged) --- */}
          <div className={styles.topBarRow}>
            <div className={styles.welcomeContainerLeft}>
              <h1 className={styles.welcomeTitleLeft}>
                Welcome, <span className={styles.highlight}>{(user.FirstName || "") + " " + (user.LastName || "")}</span>
              </h1>
              <p className={styles.welcomeTextLeft}>
                All your class info, bookings, and progress are right here.
              </p>
            </div>
            <div className={styles.membershipCardTopRight}>
              {membershipLoading ? (
                <div className={styles.membershipCardLoading}>Loading membership info...</div>
              ) : membership ? (
                <div className={styles.membershipInfoGrid}>
                  <div>
                    <div className={styles.membershipLabel}>Membership Type</div>
                    <div className={styles.membershipValue}>{membership.PlanName || membership.MemberShipType || "-"}</div>
                  </div>
                  <div>
                    <div className={styles.membershipLabel}>Start Date</div>
                    <div className={styles.membershipValue}>{toDisplayDate(membership.StartDate)}</div>
                  </div>
                  <div>
                    <div className={styles.membershipLabel}>End Date</div>
                    <div className={styles.membershipValue}>{toDisplayDate(membership.EndDate)}</div>
                  </div>
                  <div>
                    <div className={styles.membershipLabel}>Days Left</div>
                    <div className={styles.membershipValue}>{daysLeft !== null ? `${daysLeft} days` : "-"}</div>
                  </div>
                  <div>
                    <div className={styles.membershipLabel}>Class Credits Left</div>
                    <div className={styles.membershipValue}>{membership.ClassAmount !== undefined ? membership.ClassAmount : "-"}</div>
                  </div>
                  <div>
                    <div className={styles.membershipLabel}>Class Attendance</div>
                    <div className={styles.membershipValue}>{attendance}</div>
                  </div>
                </div>
              ) : (
                <div className={styles.membershipCardLoading} style={{color:"#ff6b6b"}}>No active membership</div>
              )}
            </div>
          </div>

          <div className={styles.classSectionContainer}>
            {/* --- 1) My Upcoming Classes --- */}
            <section className={`${styles.classesSection} ${styles.section}`}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}>My Upcoming Classes</h2>
              </div>
              <div className={styles.sectionUnderline}></div>

              {/* Filters (Date + Type) */}
              <div style={row}>
                <label style={label}>Date:</label>
                <input
                  type="date"
                  value={upcDate}
                  onChange={(e) => setUpcDate(e.target.value)}
                  max="2099-12-31"
                  style={dateInput}
                />
                <label style={{ ...label, marginLeft: 8 }}>Type:</label>
                <div className={styles.typeControl}>
                  <SimpleDropdown
                    value={upcType}
                    onChange={setUpcType}
                    options={typeOptions}
                    placeholder="-- All Types --"
                  />
                </div>
              </div>

              {fetchingClasses ? (
                <div className={styles.loadingMsg}>Loading classes...</div>
              ) : filteredUpcoming.length === 0 ? (
                <div className={styles.noClassesMsg}>No upcoming classes</div>
              ) : (
                <div className={styles.classListHorizontal}>
                  {filteredUpcoming.map(cls => (
                    <div className={styles.classCard} key={cls.ClassID}>
                      <div className={styles.classMainInfo}>
                        <span className={styles.classType}>{cls.ClassType}</span>
                        <span className={styles.classDateTime}>
                          {toDisplayDate(cls.Schedule)} at {cls.time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className={styles.classTrainer}>
                        Trainer: {cls.TrainerFirstName} {cls.TrainerLastName}
                      </div>
                      {(() => {
                        const lbl = getUpcomingLabel(cls.Schedule, cls.time);
                        if (!lbl) return null;
                        return <span className={styles.upcomingLabel}>{lbl}</span>;
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* --- 2) All Upcoming Classes --- */}
            <section className={`${styles.classesSection} ${styles.section}`}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}>All Upcoming Classes</h2>
              </div>
              <div className={styles.sectionUnderline}></div>

              {/* Filters */}
              <div style={row}>
                <label style={label}>Date:</label>
                <input
                  type="date"
                  value={allDate}
                  onChange={(e) => setAllDate(e.target.value)}
                  max="2099-12-31"
                  style={dateInput}
                />
                <label style={{ ...label, marginLeft: 8 }}>Type:</label>
                <div className={styles.typeControl}>
                  <SimpleDropdown
                    value={allType}
                    onChange={setAllType}
                    options={typeOptions}
                    placeholder="-- All Types --"
                  />
                </div>
              </div>

              {loadingAllUpcoming ? (
                <div className={styles.loadingMsg}>Loading all classes...</div>
              ) : filteredAllUpcoming.length === 0 ? (
                <div className={styles.noClassesMsg}>No upcoming classes in the gym</div>
              ) : (
                <div className={styles.classListHorizontal}>
                  {filteredAllUpcoming.map(cls => (
                    <div className={styles.classCard} key={cls.ClassID}>
                      <div className={styles.classMainInfo}>
                        <span className={styles.classType}>{cls.ClassTypeName || cls.ClassType || "Class"}</span>
                        <span className={styles.classDateTime}>
                          {toDisplayDate(cls.Schedule)} at {cls.time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className={styles.classTrainer}>
                        Trainer: {cls.TrainerFirstName} {cls.TrainerLastName}
                      </div>
                      <div className={styles.bookedCountRow}>
                        <span className={styles.bookedCountNum}>
                          {cls.bookedCount}/{cls.MaxParticipants} booked
                        </span>
                      </div>
                      {(() => {
                        const lbl = getUpcomingLabel(cls.Schedule, cls.time);
                        if (!lbl) return null;
                        return <span className={styles.upcomingLabel}>{lbl}</span>;
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* --- 3) My Class History --- */}
            <section className={`${styles.classesSection} ${styles.section}`}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}>My Class History</h2>
              </div>
              <div className={styles.sectionUnderline}></div>

              {/* Filters */}
              <div style={row}>
                <label style={label}>Date:</label>
                <input
                  type="date"
                  value={histDate}
                  onChange={(e) => setHistDate(e.target.value)}
                  max="2099-12-31"
                  style={dateInput}
                />
                <label style={{ ...label, marginLeft: 8 }}>Type:</label>
                <div className={styles.typeControl}>
                  <SimpleDropdown
                    value={histType}
                    onChange={setHistType}
                    options={typeOptions}
                    placeholder="-- All Types --"
                  />
                </div>
              </div>

              {fetchingClasses ? (
                <div className={styles.loadingMsg}>Loading history...</div>
              ) : filteredHistory.length === 0 ? (
                <div className={styles.noClassesMsg}>No class history yet</div>
              ) : (
                <div className={styles.classListHorizontal}>
                  {filteredHistory.map(cls => (
                    <div className={styles.classCard} key={cls.ClassID}>
                      <div className={styles.classMainInfo}>
                        <span className={styles.classType}>{cls.ClassType}</span>
                        <span className={styles.classDateTime}>
                          {toDisplayDate(cls.Schedule)} at {cls.time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className={styles.classTrainer}>
                        Trainer: {cls.TrainerFirstName} {cls.TrainerLastName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
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
    </>
  );
}
