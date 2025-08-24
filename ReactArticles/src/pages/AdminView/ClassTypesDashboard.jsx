import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import AdminHeader from "./AdminHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import styles from "./ClassTypesDashboard.module.css";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png",
];

export default function ClassTypesDashboard({ user, setUser }) {
  const navigate = useNavigate();

  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Top banner message under title
  const [msg, setMsg] = useState(null); // { type: "ok" | "err" | "warn", text }
  const dismissRef = useRef(null);      // <-- controls auto-dismiss timeout

  const [classTypes, setClassTypes] = useState([]);
  const [newType, setNewType] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [editing, setEditing] = useState({}); // { [id]: number|string }

  /* -------- gate -------- */
  useEffect(() => {
    if (user == null) return;
    if (!user || !user.Role) navigate("/login");
    else if (user.Role !== "admin") navigate("/" + user.Role);
  }, [user, navigate]);

  /* -------- background rotate -------- */
  useEffect(() => {
    const id = setInterval(() => setBgIndex((i) => (i + 1) % images.length), 5000);
    return () => clearInterval(id);
  }, []);

  /* -------- fetch types -------- */
  useEffect(() => { fetchClassTypes(); }, []);
  function fetchClassTypes() {
    axios
      .get("/admin/class-types", { withCredentials: true })
      .then((r) => setClassTypes(Array.isArray(r.data) ? r.data : []))
      .catch(() => setClassTypes([]));
  }

  /* -------- auto-dismiss banner (no flicker) -------- */
  useEffect(() => {
    if (!msg) return;
    if (dismissRef.current) clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => {
      setMsg(null);
      dismissRef.current = null;
    }, 1800);
    return () => {
      if (dismissRef.current) {
        clearTimeout(dismissRef.current);
        dismissRef.current = null;
      }
    };
  }, [msg]);

  /* -------- add type (only duplicate error; ignore empty) -------- */
  function isDuplicateType(value) {
    const name = (value || "").trim().toLowerCase();
    return classTypes.some((ct) => (ct?.type || "").trim().toLowerCase() === name);
  }

  function addClassType() {
    const trimmed = newType.trim();
    if (!trimmed) return; // ignore empty

    // frontend duplicate check
    if (isDuplicateType(trimmed)) {
      setMsg({ type: "err", text: "This class type already exists." });
      return; // stop here, no request
    }

    const max = Number(maxParticipants);
    if (!Number.isFinite(max) || max < 1) {
      setMsg({ type: "err", text: "Enter a valid max participants (≥ 1)." });
      return;
    }

    axios
      .post("/admin/class-types", { type: trimmed, MaxParticipants: max }, { withCredentials: true })
      .then(() => {
        setNewType("");
        setMsg({ type: "ok", text: "Class type added." });
        fetchClassTypes();
      })
      .catch(() => {
        // if we reached here, it's not duplicate (we filtered it already)
        setMsg({ type: "err", text: "Could not add class type. Try again." });
      });
  }

  /* -------- global max -------- */
  function updateGlobalMax() {
    const max = Number(maxParticipants);
    if (!Number.isFinite(max) || max < 1) {
      setMsg({ type: "err", text: "Global max must be a number ≥ 1." });
      return;
    }
    axios
      .put("/admin/class-types/set-max", { max }, { withCredentials: true })
      .then((r) => {
        const { updated } = r.data || {};
        if (updated) setMsg({ type: "ok", text: "Global max updated." });
        else setMsg({ type: "err", text: "Could not update global max." });
        fetchClassTypes();
      })
      .catch(() => setMsg({ type: "err", text: "Failed updating global max." }));
  }

  /* -------- per-type max -------- */
  function savePerTypeMax(id) {
    const val = Number(editing[id]);
    if (!Number.isFinite(val) || val < 1) {
      setMsg({ type: "err", text: "Max must be a number ≥ 1." });
      return;
    }
    axios
      .put(`/admin/class-type/${id}/max`, { MaxParticipants: val }, { withCredentials: true })
      .then((r) => {
        const { updated } = r.data || {};
        if (updated) setMsg({ type: "ok", text: "Max updated for class type." });
        else setMsg({ type: "err", text: "Could not update type max." });
        setEditing((e) => {
          const n = { ...e };
          delete n[id];
          return n;
        });
        fetchClassTypes();
      })
      .catch(() => setMsg({ type: "err", text: "Failed updating type max." }));
  }

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

      <AdminHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />

      <main className={styles.mainContent}>
        {/* Top error/success just under the title */}
        {msg && (
          <div
            className={
              msg.type === "ok"
                ? styles.bannerOk
                : msg.type === "warn"
                ? styles.bannerWarn
                : styles.bannerErr
            }
          >
            {msg.text}
          </div>
        )}

        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <h2 className={styles.sectionTitle}>Class Types Dashboard</h2>
            <div className={styles.sectionDivider} />

            {/* Controls */}
            <div className={styles.filtersRow}>
              <div className={styles.filterGroup} style={{ flex: 1 }}>
                <label className={styles.filterLabel}>New Type:</label>
                <input
                  className={styles.searchInput}
                  placeholder="e.g. Yoga, HIIT…"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Max:</label>
                <input
                  type="number"
                  min="1"
                  className={styles.filterDateInput}
                  value={maxParticipants}
                  onChange={(e) =>
                    setMaxParticipants(
                      e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value, 10) || 1)
                    )
                  }
                />
              </div>

              <div className={styles.filterGroup}>
                <button className={styles.btnSecondary} onClick={addClassType}>
                  Add Type
                </button>
                <button
                  className={styles.btnSecondary}
                  onClick={updateGlobalMax}
                  style={{ marginLeft: 8 }}
                >
                  Set Global Max
                </button>
              </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrap}>
              <table className={styles.peopleTable} style={{ tableLayout: "fixed", width: "100%" }}>
                <colgroup>
                  <col style={{ width: "55%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Type</th>
                    <th className={styles.thMax}>Max Participants</th>
                    <th className={styles.thEdit}>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {classTypes.length ? (
                    classTypes.map((ct) => {
                      const isEditing = Object.prototype.hasOwnProperty.call(editing, ct.id);
                      return (
                        <tr key={ct.id}>
                          <td style={{ textAlign: "left" }}>{ct.type}</td>
                          <td className={styles.tdMax}>
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                className={styles.filterDateInput}
                                style={{ height: 38, padding: "0 12px", width: 110 }}
                                value={editing[ct.id]}
                                onChange={(e) =>
                                  setEditing((prev) => ({
                                    ...prev,
                                    [ct.id]:
                                      e.target.value === ""
                                        ? ""
                                        : Math.max(1, parseInt(e.target.value, 10) || 1),
                                  }))
                                }
                              />
                            ) : (
                              ct.MaxParticipants
                            )}
                          </td>
                          <td className={styles.tdEdit}>
                            {!isEditing ? (
                              <button
                                className={styles.badgeBtn}
                                onClick={() =>
                                  setEditing((prev) => ({ ...prev, [ct.id]: ct.MaxParticipants }))
                                }
                              >
                                Edit
                              </button>
                            ) : (
                              <>
                                <button className={styles.badgeBtn} onClick={() => savePerTypeMax(ct.id)}>
                                  Save
                                </button>
                                <button
                                  className={styles.btnSecondary}
                                  onClick={() =>
                                    setEditing((prev) => {
                                      const n = { ...prev };
                                      delete n[ct.id];
                                      return n;
                                    })
                                  }
                                  style={{ marginLeft: 6 }}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className={styles.noClassesMsg}>
                        No class types yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
  );
}
