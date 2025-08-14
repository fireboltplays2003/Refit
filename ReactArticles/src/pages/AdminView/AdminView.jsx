import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import styles from "./AdminView.module.css";
import axios from "axios";
import LightSelect from "../../components/LightSelect";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png",
];

function toDisplayDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  } catch {
    return "";
  }
}

function getUpcomingLabel(dateStr, timeStr) {
  const now = new Date();
  const dt = new Date(dateStr + "T" + (timeStr || "00:00"));
  const daysDiff = Math.floor((dt - now) / 86400000);
  const sameDay =
    now.getFullYear() === dt.getFullYear() &&
    now.getMonth() === dt.getMonth() &&
    now.getDate() === dt.getDate();
  if (sameDay) return "Today";
  if (dt > now && daysDiff <= 7) return "This Week";
  if (dt > now && daysDiff <= 30) return "This Month";
  return null;
}

function getFilenameFromContentDisposition(cd) {
  if (!cd) return null;
  const m = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
  try {
    return decodeURIComponent(m?.[1] || m?.[2] || "");
  } catch {
    return m?.[1] || m?.[2] || "";
  }
}

export default function AdminView({ user, setUser }) {
  const navigate = useNavigate();
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text}

  // class types
  const [classTypes, setClassTypes] = useState([]);

  // upcoming / previous classes
  const [upcomingRaw, setUpcomingRaw] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [prevRaw, setPrevRaw] = useState([]);
  const [loadingPrev, setLoadingPrev] = useState(true);

  // filters
  const DATE_CHIPS = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "30d", label: "Next 30 Days" },
    { key: "all", label: "All Upcoming" },
  ];
  const [activeDateKey, setActiveDateKey] = useState("30d");
  const [upcomingDate, setUpcomingDate] = useState("");
  const [upcomingType, setUpcomingType] = useState("");
  const [prevDate, setPrevDate] = useState("");
  const [prevType, setPrevType] = useState("");

  // pending trainers
  const [pending, setPending] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);

  // analytics
  const [analyticsWindow, setAnalyticsWindow] = useState("30d");
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // members modal
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState([]);

  // people explorer
  const [peopleRole, setPeopleRole] = useState("trainer");
  const [peopleQ, setPeopleQ] = useState("");
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(true);

  // insights modal
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (!user || !user.Role) navigate("/login");
    else if (user.Role !== "admin") navigate("/" + user.Role);
  }, [user, navigate]);

  useEffect(() => {
    const id = setInterval(() => setBgIndex((i) => (i + 1) % images.length), 5000);
    return () => clearInterval(id);
  }, []);

  /* ---------- bootstrap data ---------- */
  useEffect(() => {
    axios
      .get("/admin/class-types", { withCredentials: true })
      .then((r) => setClassTypes(r.data || []))
      .catch(() => setClassTypes([]));
  }, []);

  useEffect(() => {
    setLoadingUpcoming(true);
    axios
      .get("/admin/all-upcoming-classes-with-count", { withCredentials: true })
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : [];
        arr.sort(
          (a, b) =>
            new Date(a.Schedule + "T" + (a.time || "00:00")) -
            new Date(b.Schedule + "T" + (b.time || "00:00"))
        );
        setUpcomingRaw(arr);
      })
      .catch(() => setUpcomingRaw([]))
      .finally(() => setLoadingUpcoming(false));
  }, []);

  useEffect(() => {
    setLoadingPrev(true);
    axios
      .get("/admin/all-previous-30days-classes-with-count", { withCredentials: true })
      .then((r) => setPrevRaw(r.data || []))
      .catch(() => setPrevRaw([]))
      .finally(() => setLoadingPrev(false));
  }, []);

  useEffect(() => {
    setLoadingPending(true);
    axios
      .get("/admin/pending-trainers", { withCredentials: true })
      .then((r) => setPending(r.data || []))
      .catch(() => setPending([]))
      .finally(() => setLoadingPending(false));
  }, []);

  /* ---------- helpers ---------- */
  const approveTrainer = async (UserID) => {
    try {
      await axios.post("/admin/approve-trainer", { UserID }, { withCredentials: true });
      setPending((p) => p.filter((x) => x.UserID !== UserID));
      setMsg({ type: "ok", text: "Trainer approved successfully." });
    } catch {
      setMsg({ type: "err", text: "Failed to approve trainer." });
    }
  };

  const rejectTrainer = async (UserID) => {
    try {
      await axios.post("/admin/reject-trainer", { UserID }, { withCredentials: true });
    } catch {}
    setPending((p) => p.filter((x) => x.UserID !== UserID));
    setMsg({ type: "ok", text: "Trainer request rejected and removed." });
  };

  const downloadCertification = async (userId) => {
    try {
      const res = await fetch(`/admin/trainer-cert/${userId}?download=1`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("not ok");

      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const fallbackName = "Certification";
      theExt:
      {
        /* fallthrough block for readability */
      }
      const ext = (blob.type && blob.type.split("/")[1]) ? "." + blob.type.split("/")[1] : ".pdf";
      const filename = (getFilenameFromContentDisposition(cd) || (fallbackName + ext)).replace(/[/\\?%*:|"<>]/g, "_");

      if (window.showSaveFilePicker) {
        const types = [{ description: "File", accept: { [blob.type || "application/octet-stream"]: [ext] } }];
        const handle = await window.showSaveFilePicker({ suggestedName: filename, types });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } catch {
      setMsg({ type: "err", text: "Could not download the CV." });
    }
  };

  // analytics
  useEffect(() => {
    setLoadingAnalytics(true);
    axios
      .get(`/admin/analytics?window=${analyticsWindow === "all" ? "all" : "30d"}`, {
        withCredentials: true,
      })
      .then((r) => setAnalytics(r.data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoadingAnalytics(false));
  }, [analyticsWindow]);

  // filters
  const upcomingFiltered = useMemo(() => {
    const now = new Date();
    let min = new Date(0);
    let max = new Date("9999-12-31T23:59:59");
    if (activeDateKey === "today") {
      min = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      max = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (activeDateKey === "week") {
      min = now;
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      max = end;
    } else if (activeDateKey === "30d") {
      min = now;
      const end = new Date(now);
      end.setDate(end.getDate() + 30);
      max = end;
    }
    return upcomingRaw.filter((c) => {
      const dt = new Date(c.Schedule + "T" + (c.time || "00:00"));
      if (!(dt >= min && dt <= max)) return false;
      if (upcomingDate && c.Schedule !== upcomingDate) return false;
      if (upcomingType && String(c.ClassType) !== String(upcomingType)) return false;
      return true;
    });
  }, [upcomingRaw, activeDateKey, upcomingDate, upcomingType]);

  const prevFiltered = useMemo(() => {
    return prevRaw.filter((c) => {
      if (prevDate && c.Schedule !== prevDate) return false;
      if (prevType && String(c.ClassType) !== String(prevType)) return false;
      return true;
    });
  }, [prevRaw, prevDate, prevType]);

  // members modal
  async function openMembersModal(classId) {
    try {
      setMembersOpen(true);
      setMembersLoading(true);
      const { data } = await axios.get(`/admin/class-members/${classId}`, { withCredentials: true });
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }
  function closeMembersModal() {
    setMembersOpen(false);
    setMembers([]);
  }

  // people explorer data (debounced)
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPeopleLoading(true);
      axios
        .get("/admin/people", { withCredentials: true, params: { role: peopleRole, q: peopleQ } })
        .then((r) => setPeople(Array.isArray(r.data) ? r.data : []))
        .catch(() => setPeople([]))
        .finally(() => setPeopleLoading(false));
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [peopleRole, peopleQ]);

  const roleOptions = [
    { value: "trainer", label: "Trainers" },
    { value: "member", label: "Members" },
    { value: "user", label: "Users" },
    { value: "onHold", label: "On Hold" },
    { value: "admin", label: "Admins" },
    { value: "all", label: "All" },
  ];

  function openInsights(trainerId) {
    setInsightsOpen(true);
    setInsightsLoading(true);
    setInsights(null);
    axios
      .get(`/admin/trainer-insights/${trainerId}?window=30d`, { withCredentials: true })
      .then((r) => setInsights(r.data))
      .catch(() => setInsights(null))
      .finally(() => setInsightsLoading(false));
  }

  // DELETE: silent (no confirm), show banner after
  async function deleteUser(userId) {
    try {
      await axios.delete(`/admin/user/${userId}`, { withCredentials: true });
      setPeople((list) => list.filter((p) => p.UserID !== userId));
      setMsg({ type: "ok", text: "User deleted." });
    } catch {
      setMsg({ type: "err", text: "Delete failed. Ensure your backend has DELETE /admin/user/:id route." });
    }
  }

  // helper for analytics times
  const chosenTimes = (analyticsWindow === "all"
    ? (analytics?.popularTimesAll || [])
    : (analytics?.popularTimes30 || analytics?.popularTimes || []));

  return (
    <div className={styles.bgWrapper}>
      {images.map((img, i) => (
        <div
          key={i}
          className={styles.bgImg}
          style={{ backgroundImage: `url(${img})`, opacity: bgIndex === i ? 1 : 0, zIndex: 1, transition: "opacity 1.2s" }}
        />
      ))}
      <div className={styles.overlay} />

      <AdminHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />

      <main className={styles.mainContent}>
        {msg && (
          <div
            className={msg.type === "ok" ? styles.bannerOk : styles.bannerErr}
            onAnimationEnd={() => setTimeout(() => setMsg(null), 1800)}
          >
            {msg.text}
          </div>
        )}

        {/* ===================== PEOPLE EXPLORER (FIRST) ===================== */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <div className={styles.peopleHeader}>
              <h2 className={styles.sectionTitle}>People Explorer</h2>
            </div>

            <div className={styles.filtersRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Role:</label>
                <LightSelect
                  className={`${styles.selectInline} ${styles.selectCompact}`}
                  width={170}
                  options={roleOptions}
                  value={peopleRole}
                  onChange={setPeopleRole}
                  placeholder="Role"
                />
              </div>

              <div className={styles.filterGroup} style={{ flex: 1 }}>
                <label className={styles.filterLabel}>Search:</label>
                <input
                  value={peopleQ}
                  onChange={(e) => setPeopleQ(e.target.value)}
                  className={styles.searchInput}
                  placeholder="name, email, phone..."
                />
              </div>
            </div>

            <div className={styles.sectionDivider} />

            {peopleLoading ? (
              <div className={styles.loadingMsg}>Loading…</div>
            ) : people.length === 0 ? (
              <div className={`${styles.noClassesMsg} ${styles.softMsg}`}>No results.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.peopleTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Birthdate</th>
                      <th className={styles.center}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((p) => (
                      <tr key={p.UserID}>
                        <td>{p.FirstName} {p.LastName}</td>
                        <td>{p.Email}</td>
                        <td>{p.Phone}</td>
                        <td>{p.Role}</td>
                        <td>{toDisplayDate(p.DateOfBirth)}</td>
                        <td className={styles.center}>
                          {p.Role === "trainer" && (
                            <button className={styles.badgeBtn} onClick={() => openInsights(p.UserID)}>Insights</button>
                          )}
                          {p.Role === "trainer" && p.Certifications && (
                            <button className={styles.badgeBtn} onClick={() => downloadCertification(p.UserID)}>CV</button>
                          )}
                          <button className={styles.badgeDanger} onClick={() => deleteUser(p.UserID)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* ===================== PENDING TRAINERS ===================== */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <h2 className={styles.sectionTitle}>Trainer Requests (On Hold)</h2>
            <div className={styles.sectionDivider} />
            {loadingPending ? (
              <div className={styles.loadingMsg}>Loading pending trainers...</div>
            ) : pending.length === 0 ? (
              <div className={`${styles.noClassesMsg} ${styles.softMsg}`}>No pending trainer requests.</div>
            ) : (
              <div className={styles.pendingList}>
                {pending.map((t) => (
                  <div className={styles.pendingCard} key={t.UserID}>
                    <div className={styles.pendingTop}>
                      <div className={styles.pendingName}>
                        {t.FirstName} {t.LastName}
                      </div>
                      <div className={styles.pendingContact}>
                        {t.Email} • {t.Phone}
                      </div>
                      <div className={styles.pendingMeta}>Birthdate: {toDisplayDate(t.DateOfBirth)}</div>
                    </div>
                    <div className={styles.pendingActions}>
                      <button className={styles.btnSecondary} onClick={() => downloadCertification(t.UserID)}>
                        Download CV
                      </button>
                      <button className={styles.btnApprove} onClick={() => approveTrainer(t.UserID)}>
                        Approve
                      </button>
                      <button className={styles.btnReject} onClick={() => rejectTrainer(t.UserID)}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ===================== ANALYTICS ===================== */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>Analytics</h2>
              <div className={styles.toggleWrap}>
                <button
                  className={`${styles.toggleBtn} ${analyticsWindow === "30d" ? styles.toggleActive : ""}`}
                  onClick={() => setAnalyticsWindow("30d")}
                >
                  Last 30 days
                </button>
                <button
                  className={`${styles.toggleBtn} ${analyticsWindow === "all" ? styles.toggleActive : ""}`}
                  onClick={() => setAnalyticsWindow("all")}
                >
                  All time
                </button>
              </div>
            </div>

            <div className={styles.sectionDivider} />
            {loadingAnalytics ? (
              <div className={styles.loadingMsg}>Crunching numbers…</div>
            ) : !analytics ? (
              <div className={`${styles.noClassesMsg} ${styles.softMsg}`}>No analytics available.</div>
            ) : (
              <div className={styles.analyticsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statTitle}>Most Preferred Class Types</div>
                  <div className={styles.statSub}>Ranked visually. “Utilization” = seats filled / seats offered.</div>
                  <div className={styles.barList}>
                    {analytics.classTypes.slice(0, 5).map((row, i) => {
                      const lead = Math.max(0.01, analytics.classTypes[0]?.fillRate || analytics.classTypes[0]?.utilization || 0.01);
                      const util = (row.fillRate ?? row.utilization ?? 0);
                      const pct = Math.min(100, Math.round((util / lead) * 100));
                      const utilPct = Math.round(util * 100);
                      return (
                        <div key={row.id ?? i} className={styles.barRow}>
                          <div className={styles.barLabel}>{i + 1}. {row.type}</div>
                          <div className={styles.barTrack}><div className={styles.barFill} style={{ width: pct + "%" }} /></div>
                          <div className={styles.smallNote}>Utilization: {utilPct}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statTitle}>Trainers — Top &amp; Least (Top 3 / Least 3)</div>
                  <div className={styles.trainersColumns}>
                    <div>
                      <div className={styles.trainersColTitle}>Top</div>
                      {analytics.topTrainers.slice(0, 3).map((t, i) => (
                        <div key={t.UserID} className={styles.trainerRow}>{i + 1}. {t.FirstName} {t.LastName}</div>
                      ))}
                      {analytics.topTrainers.length === 0 && <div className={styles.dim}>No data</div>}
                    </div>
                    <div>
                      <div className={styles.trainersColTitle}>Least</div>
                      {analytics.leastTrainers.slice(0, 3).map((t, i) => (
                        <div key={t.UserID} className={styles.trainerRow}>{i + 1}. {t.FirstName} {t.LastName}</div>
                      ))}
                      {analytics.leastTrainers.length === 0 && <div className={styles.dim}>No data</div>}
                    </div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statTitle}>Most Chosen Class Times</div>
                  <div className={styles.pillWrap}>
                    {chosenTimes.length ? (
                      chosenTimes.map((slot) => (
                        <div key={slot.hourSlot} className={styles.pill}>{slot.hourSlot}</div>
                      ))
                    ) : (
                      <div className={styles.dim}>No data</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ===================== ALL UPCOMING ===================== */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <h2 className={styles.sectionTitle}>All Upcoming Classes</h2>

            <div className={styles.chipsScroller}>
              {DATE_CHIPS.map((c) => (
                <button
                  key={c.key}
                  className={`${styles.chip} ${activeDateKey === c.key ? styles.chipActive : ""}`}
                  onClick={() => setActiveDateKey(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* alignment matches TrainerView */}
            <div className={`${styles.filtersRow} ${styles.filtersRowAligned}`}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Date:</label>
                <input
                  type="date"
                  className={styles.filterDateInput}
                  value={upcomingDate}
                  onChange={(e) => setUpcomingDate(e.target.value)}
                  max="2099-12-31"
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Type:</label>
                <LightSelect
                  className={styles.selectInline}
                  width={270}
                  options={[{ value: "", label: "All Types" }, ...classTypes.map((ct) => ({ value: ct.id, label: ct.type }))]}
                  value={upcomingType}
                  onChange={setUpcomingType}
                  placeholder="All Types"
                />
              </div>
            </div>

            <div className={styles.sectionDivider} />
            {loadingUpcoming ? (
              <div className={styles.loadingMsg}>Loading classes...</div>
            ) : upcomingFiltered.length === 0 ? (
              <div className={`${styles.noClassesMsg} ${styles.softMsg}`}>No classes for the selected filters.</div>
            ) : (
              <div className={styles.classListHorizontal}>
                {upcomingFiltered.map((cls) => {
                  const lbl = getUpcomingLabel(cls.Schedule, cls.time);
                  return (
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

                      <button className={styles.wideBtn} onClick={() => openMembersModal(cls.ClassID)}>
                        View Members
                      </button>

                      {lbl && <span className={styles.labelBtn}>{lbl}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ===================== PREVIOUS 30 DAYS ===================== */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <h2 className={styles.sectionTitle}>Previous Month's Classes</h2>

            {/* alignment matches TrainerView */}
            <div className={`${styles.filtersRow} ${styles.filtersRowAligned}`}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Date:</label>
                <input
                  type="date"
                  className={styles.filterDateInput}
                  value={prevDate}
                  onChange={(e) => setPrevDate(e.target.value)}
                  max="2099-12-31"
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Type:</label>
                <LightSelect
                  className={styles.selectInline}
                  width={270}
                  options={[{ value: "", label: "All Types" }, ...classTypes.map((ct) => ({ value: ct.id, label: ct.type }))]}
                  value={prevType}
                  onChange={setPrevType}
                  placeholder="All Types"
                />
              </div>
            </div>

            <div className={styles.sectionDivider} />
            {loadingPrev ? (
              <div className={styles.loadingMsg}>Loading classes...</div>
            ) : prevFiltered.length === 0 ? (
              <div className={`${styles.noClassesMsg} ${styles.softMsg}`}>No classes found for previous month.</div>
            ) : (
              <div className={styles.classListHorizontal}>
                {prevFiltered.map((cls) => (
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

                    <button className={styles.wideBtn} onClick={() => openMembersModal(cls.ClassID)}>
                      View Members
                    </button>

                    {getUpcomingLabel(cls.Schedule, cls.time) && (
                      <span className={styles.labelBtn}>{getUpcomingLabel(cls.Schedule, cls.time)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ===================== MEMBERS MODAL ===================== */}
        {membersOpen && (
          <div className={styles.popupBackdrop} onClick={closeMembersModal}>
            <div className={styles.membersModal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={closeMembersModal}>&times;</button>
              <div className={styles.membersModalTitle}>Class Members</div>

              {membersLoading ? (
                <div className={styles.loadingMsg}>Loading…</div>
              ) : members && members.length > 0 ? (
                <div className={styles.modalScroll}>
                  <table className={styles.membersTable}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.UserID}>
                          <td>{m.FirstName} {m.LastName}</td>
                          <td>{m.Email}</td>
                          <td>{m.Phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`${styles.noClassesMsg} ${styles.softMsg}`}>No members booked</div>
              )}
            </div>
          </div>
        )}

        {/* ===================== INSIGHTS MODAL ===================== */}
        {insightsOpen && (
          <div className={styles.popupBackdrop} onClick={() => setInsightsOpen(false)}>
            <div className={styles.insightsModal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setInsightsOpen(false)}>&times;</button>
              <div className={styles.insightsTitle}>Trainer Insights (last 30 days)</div>

              {insightsLoading ? (
                <div className={styles.loadingMsg}>Loading…</div>
              ) : !insights ? (
                <div className={`${styles.noClassesMsg} ${styles.softMsg}`}>No data.</div>
              ) : (
                <div className={styles.insightsBody}>
                  <div className={styles.insightsGrid}>
                    <div className={styles.insightsCard}>
                      <div className={styles.insightsCardTitle}>Totals</div>
                      <div className={styles.totalsRow}>
                        <div><span className={styles.totalNum}>{insights.totals.classes}</span><span className={styles.totalLbl}>Classes</span></div>
                        <div><span className={styles.totalNum}>{insights.totals.bookings}</span><span className={styles.totalLbl}>Bookings</span></div>
                        <div><span className={styles.totalNum}>{Math.round((insights.totals.avgFill ?? insights.totals.avgUtilization ?? 0) * 100)}%</span><span className={styles.totalLbl}>Avg Utilization</span></div>
                      </div>
                    </div>

                    <div className={styles.insightsCard}>
                      <div className={styles.insightsCardTitle}>Top Class Types</div>
                      <ul className={styles.simpleList}>
                        {insights.topTypes.map((t, i) => (
                          <li key={i}>{i + 1}. {t.type}</li>
                        ))}
                        {insights.topTypes.length === 0 && <li className={styles.dim}>No data</li>}
                      </ul>
                    </div>

                    <div className={styles.insightsCard}>
                      <div className={styles.insightsCardTitle}>Popular Times</div>
                      <div className={styles.pillWrap}>
                        {insights.popularTimes.length ? (
                          insights.popularTimes.map((pt, i) => (
                            <div key={i} className={styles.pill}>{pt.hourSlot}</div>
                          ))
                        ) : (
                          <div className={styles.dim}>No data</div>
                        )}
                      </div>
                    </div>

                    {/* Averages */}
                    <div className={styles.insightsCard}>
                      <div className={styles.insightsCardTitle}>Averages</div>
                      <div className={styles.totalsRow}>
                        <div>
                          <span className={styles.totalNum}>
                            {insights.totals.classes > 0 ? Math.round((insights.totals.bookings / insights.totals.classes) * 10) / 10 : 0}
                          </span>
                          <span className={styles.totalLbl}>Avg Class Size</span>
                        </div>
                        <div>
                          <span className={styles.totalNum}>
                            {Math.round((insights.totals.avgFill ?? insights.totals.avgUtilization ?? 0) * 100)}%
                          </span>
                          <span className={styles.totalLbl}>Avg Fill</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.insightsCardWide}>
                      <div className={styles.insightsCardTitle}>Upcoming (next)</div>
                      <div className={styles.modalTableScrollFixed}>
                        <table className={styles.smallTable}>
                          <colgroup>
                            <col style={{ width: "40%" }} />
                            <col style={{ width: "35%" }} />
                            <col style={{ width: "25%" }} />
                          </colgroup>
                          <thead><tr><th>When</th><th>Type</th><th>Booked</th></tr></thead>
                          <tbody>
                            {insights.upcoming.map(u => (
                              <tr key={u.ClassID}>
                                <td>{toDisplayDate(u.Schedule)} {u.time?.slice(0,5)}</td>
                                <td>{u.type}</td>
                                <td>{u.bookedCount}/{u.MaxParticipants}</td>
                              </tr>
                            ))}
                            {insights.upcoming.length === 0 && <tr><td colSpan={3} className={styles.dim}>None</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className={styles.insightsCardWide}>
                      <div className={styles.insightsCardTitle}>Recent</div>
                      <div className={`${styles.modalTableScrollFixed} ${insights.recent.length > 3 ? styles.modalTableScrollTall : ""}`}>
                        <table className={styles.smallTable}>
                          <colgroup>
                            <col style={{ width: "40%" }} />
                            <col style={{ width: "35%" }} />
                            <col style={{ width: "25%" }} />
                          </colgroup>
                          <thead><tr><th>When</th><th>Type</th><th>Booked</th></tr></thead>
                          <tbody>
                            {insights.recent.map(u => (
                              <tr key={u.ClassID}>
                                <td>{toDisplayDate(u.Schedule)} {u.time?.slice(0,5)}</td>
                                <td>{u.type}</td>
                                <td>{u.bookedCount}/{u.MaxParticipants}</td>
                              </tr>
                            ))}
                            {insights.recent.length === 0 && <tr><td colSpan={3} className={styles.dim}>None</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <ProfileModal show={showProfile} onClose={() => setShowProfile(false)} userData={user} onUpdate={setUser} />
    </div>
  );
}
