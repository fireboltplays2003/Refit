import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import axios from "axios";
import styles from "./TrainerView.module.css";
import LightSelect from "../../components/LightSelect";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png",
];

function toDisplayDate(isoDate) {
  if (!isoDate) return "";
  try {
    const date = new Date(isoDate);
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  } catch {
    return "Invalid date";
  }
}

function getUpcomingLabel(classDate, classTime) {
  const now = new Date();
  const classDateTime = new Date(classDate + "T" + (classTime || "00:00"));

  function weekNo(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  const sameDay =
    now.getFullYear() === classDateTime.getFullYear() &&
    now.getMonth() === classDateTime.getMonth() &&
    now.getDate() === classDateTime.getDate();

  if (sameDay) return "Today";

  const wNow = weekNo(now);
  const wCls = weekNo(classDateTime);

  if (classDateTime > now && wNow === wCls) {
    const diffDays = Math.floor((classDateTime - now) / (1000 * 60 * 60 * 24));
    return diffDays < 3 ? "in 3 days" : "This Week";
  }
  if (
    (classDateTime.getFullYear() === now.getFullYear() && wCls === wNow + 1) ||
    (now.getFullYear() + 1 === classDateTime.getFullYear() && wNow === 52 && wCls === 1)
  ) return "Next Week";

  if (
    classDateTime.getFullYear() > now.getFullYear() ||
    (classDateTime.getFullYear() === now.getFullYear() && classDateTime.getMonth() > now.getMonth() + 1)
  ) return "Next Month";

  return null;
}

function getLabelColor(lbl) {
  switch (lbl) {
    case "Today": return { background: "#93ef87", color: "#1a3120" };
    case "in 3 days": return { background: "#ffd966", color: "#715700" };
    case "This Week": return { background: "#6ea8ff", color: "#223366" };
    case "Next Week": return { background: "#ffcf67", color: "#715700" };
    case "Next Month": return { background: "#b6b9c5", color: "#353942" };
    default: return { background: "#e0e0e0", color: "#333" };
  }
}

export default function TrainerView({ user, setUser }) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Filters + data
  const [classTypes, setClassTypes] = useState([]);
  const [filterDateMy, setFilterDateMy] = useState("");
  const [filterTypeMy, setFilterTypeMy] = useState("");
  const [filterDateAll, setFilterDateAll] = useState("");
  const [filterTypeAll, setFilterTypeAll] = useState("");

  const [myClasses, setMyClasses] = useState([]);
  const [loadingMy, setLoadingMy] = useState(true);

  const [allUpcomingClasses, setAllUpcomingClasses] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);

  // Trainer Insights (top-right)
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({ topType: null, topTimes: [] });

  // Members modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (!user || !user.UserID || user.Role !== "trainer") {
      navigate("/login");
    } else {
      setAuthorized(true);
    }
  }, [user, navigate]);

  useEffect(() => {
    const id = setInterval(() => setBgIndex((n) => (n + 1) % images.length), 5000);
    return () => clearInterval(id);
  }, []);

  // Load class types for filters
  useEffect(() => {
    axios.get("/trainer/class-types", { withCredentials: true })
      .then(res => setClassTypes(res.data || []))
      .catch(() => setClassTypes([]));
  }, []);

  // Load Trainer Insights (scoped to this trainer)
  useEffect(() => {
    if (!authorized) return;
    setStatsLoading(true);
    axios.get("/trainer/stats", { withCredentials: true })
      .then(res => setStats({
        topType: res.data?.topType || null,
        topTimes: res.data?.topTimes || []
      }))
      .catch(() => setStats({ topType: null, topTimes: [] }))
      .finally(() => setStatsLoading(false));
  }, [authorized]);

  // Load "My Classes" (with members)
  useEffect(() => {
    if (!user?.UserID) return;
    setLoadingMy(true);
    axios.get("/trainer/classes-with-members", { withCredentials: true })
      .then(res => {
        const now = new Date();
        const sorted = (res.data || [])
          .filter(c => {
            const dt = new Date(c.Schedule + "T" + (c.time || "00:00"));
            return c.TrainerID === user.UserID && dt >= now;
          })
          .sort((a, b) =>
            new Date(a.Schedule + "T" + (a.time || "00:00")) -
            new Date(b.Schedule + "T" + (b.time || "00:00"))
          );
        setMyClasses(sorted);
      })
      .catch(() => setMyClasses([]))
      .finally(() => setLoadingMy(false));
  }, [user]);

  // Load "All Upcoming Classes" (not mine)
  useEffect(() => {
    if (!user?.UserID) return;
    setLoadingAll(true);
    axios.get("/trainer/all-upcoming-classes-with-count", { withCredentials: true })
      .then(res => {
        const now = new Date();
        const list = (res.data || [])
          .filter(c => {
            const dt = new Date(c.Schedule + "T" + (c.time || "00:00"));
            return c.TrainerID !== user.UserID && dt >= now;
          })
          .sort((a, b) =>
            new Date(a.Schedule + "T" + (a.time || "00:00")) -
            new Date(b.Schedule + "T" + (b.time || "00:00"))
          );
        setAllUpcomingClasses(list);
      })
      .catch(() => setAllUpcomingClasses([]))
      .finally(() => setLoadingAll(false));
  }, [user]);

  function filterList(list, date, type) {
    return list.filter(c => {
      let ok = true;
      if (date) ok = ok && c.Schedule === date;
      if (type) ok = ok && String(c.ClassType) === String(type);
      return ok;
    });
  }

  function openMembersModal(members) {
    setSelectedMembers(members || []);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setSelectedMembers([]);
  }

  if (!authorized) return null;

  return (
    <div className={styles.bgWrapper}>
      {images.map((img, i) => (
        <div
          key={i}
          className={styles.bgImg}
          style={{
            backgroundImage: `url(${img})`,
            opacity: bgIndex === i ? 1 : 0,
            zIndex: 1,
            transition: "opacity 1.2s",
          }}
        />
      ))}
      <div className={styles.overlay} />

      <TrainerHeader trainer={user} setTrainer={setUser} onProfile={() => setShowProfile(true)} />

      <main className={styles.mainContent}>
        {/* Top row: welcome + insights */}
        <div className={styles.flexRow}>
          <div className={styles.welcomeContainer}>
            <div className={styles.welcomeInner}>
              <h1 className={styles.welcomeTitle}>
                Welcome Back, <span className={styles.welcomeHighlight}>
                  {`${user?.FirstName || ""} ${user?.LastName || ""}`}
                </span>!
              </h1>
              <p className={styles.welcomeText}>
                Here is your dashboard. You can manage your classes, and more.
              </p>
            </div>
          </div>

          <div className={styles.upcomingCard}>
            {statsLoading ? (
              <>
                <div className={styles.upcomingTitle}>Loading insights…</div>
                <div className={styles.upcomingUnderline} />
              </>
            ) : (
              <>
                <div className={styles.upcomingTitle}>Trainer Insights</div>
                <div className={styles.upcomingUnderline} />
                <ul className={styles.upcomingList}>
                  <li className={styles.upcomingItem}>
                    <span className={styles.upcomingType}>Top Class Type</span>
                    <span className={styles.upcomingMembers}>
                      {stats.topType?.type || "-"}
                    </span>
                  </li>
                  <li className={styles.upcomingItem}>
                    <span className={styles.upcomingType}>Top Class Times</span>
                    <span className={styles.upcomingMembers}>
                      {Array.isArray(stats.topTimes) && stats.topTimes.length
                        ? stats.topTimes
                            .map(t => (typeof t === "string" ? t : t?.time))
                            .filter(Boolean)
                            .join(", ")
                        : "-"}
                    </span>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>

        {/* My Classes */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <h2 className={styles.sectionTitle}>My Classes</h2>

            <div className={styles.filtersRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Date:</label>
                <input
                  type="date"
                  className={styles.filterDateInput}
                  value={filterDateMy}
                  onChange={(e) => setFilterDateMy(e.target.value)}
                  max="2099-12-31"
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Type:</label>
                <LightSelect
                  className={styles.selectInline}
                  width={270}
                  options={[{ value: "", label: "All Types" }, ...classTypes.map(ct => ({ value: ct.id, label: ct.type }))]}
                  value={filterTypeMy}
                  onChange={setFilterTypeMy}
                  placeholder="All Types"
                />
              </div>
            </div>

            {loadingMy ? (
              <div className={styles.loadingMsg}>Loading classes...</div>
            ) : filterList(myClasses, filterDateMy, filterTypeMy).length === 0 ? (
              <div className={styles.noClassesMsg}>You have no upcoming classes.</div>
            ) : (
              <div className={styles.classListHorizontal}>
                {filterList(myClasses, filterDateMy, filterTypeMy).map((cls) => {
                  const lbl = getUpcomingLabel(cls.Schedule, cls.time);
                  const colorStyle = lbl ? getLabelColor(lbl) : {};
                  return (
                    <div className={styles.classCard} key={cls.ClassID}>
                      <div className={styles.classMainInfo}>
                        <span className={styles.classType}>
                          {cls.ClassTypeName || cls.ClassType || "Class"}
                        </span>
                        <span className={styles.classDateTime}>
                          {toDisplayDate(cls.Schedule)} at {cls.time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className={styles.classTrainer}>
                        Trainer: {cls.TrainerFirstName} {cls.TrainerLastName}
                      </div>
                      <div className={styles.classCountBox}>
                        {typeof cls.Members !== "undefined" && typeof cls.MaxParticipants !== "undefined" ? (
                          <span>
                            {cls.Members.length}/{cls.MaxParticipants > 0 ? cls.MaxParticipants : "?"} booked
                          </span>
                        ) : (
                          <span>?</span>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "14px" }}>
                        <button className={styles.wideBtn} onClick={() => openMembersModal(cls.Members)}>
                          View Members
                        </button>
                        {lbl && (
                          <span className={styles.labelBtn} style={colorStyle}>
                            {lbl}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* All Upcoming Classes */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <h2 className={styles.sectionTitle}>All Upcoming Classes</h2>

            <div className={styles.filtersRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Date:</label>
                <input
                  type="date"
                  className={styles.filterDateInput}
                  value={filterDateAll}
                  onChange={(e) => setFilterDateAll(e.target.value)}
                  max="2099-12-31"
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Type:</label>
                <LightSelect
                  className={styles.selectInline}
                  width={270}
                  options={[{ value: "", label: "All Types" }, ...classTypes.map(ct => ({ value: ct.id, label: ct.type }))]}
                  value={filterTypeAll}
                  onChange={setFilterTypeAll}
                  placeholder="All Types"
                />
              </div>
            </div>

            {loadingAll ? (
              <div className={styles.loadingMsg}>Loading classes...</div>
            ) : filterList(allUpcomingClasses, filterDateAll, filterTypeAll).length === 0 ? (
              <div className={styles.noClassesMsg}>No upcoming classes.</div>
            ) : (
              <div className={styles.classListHorizontal}>
                {filterList(allUpcomingClasses, filterDateAll, filterTypeAll).map((cls) => {
                  const lbl = getUpcomingLabel(cls.Schedule, cls.time);
                  const colorStyle = lbl ? getLabelColor(lbl) : {};
                  return (
                    <div className={styles.classCard} key={cls.ClassID}>
                      <div className={styles.classMainInfo}>
                        <span className={styles.classType}>
                          {cls.ClassTypeName || cls.ClassType || "Class"}
                        </span>
                        <span className={styles.classDateTime}>
                          {toDisplayDate(cls.Schedule)} at {cls.time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className={styles.classTrainer}>
                        Trainer: {cls.TrainerFirstName} {cls.TrainerLastName}
                      </div>
                      <div className={styles.classCountBox}>
                        {typeof cls.bookedCount !== "undefined" && typeof cls.MaxParticipants !== "undefined" ? (
                          <span>
                            {cls.bookedCount}/{cls.MaxParticipants > 0 ? cls.MaxParticipants : "?"} booked
                          </span>
                        ) : (
                          <span>?</span>
                        )}
                      </div>
                      {lbl && (
                        <span className={styles.labelBtn} style={colorStyle}>
                          {lbl}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Members Modal */}
        {modalOpen && (
          <div className={styles.popupBackdrop} onClick={closeModal}>
            <div className={styles.membersModal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.membersClose} onClick={closeModal}>&times;</button>
              <div className={styles.membersModalTitle}>Class Members</div>
              {selectedMembers && selectedMembers.length > 0 ? (
                <table className={styles.membersTable}>
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Phone</th>
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
                    <tr><td colSpan={3}>No members booked</td></tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
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
