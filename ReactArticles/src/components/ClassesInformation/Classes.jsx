import React, { useEffect, useState, useRef } from "react";
import styles from "./Classes.module.css";
import ProfileModal from "../../components/ProfileModal";
import Footer from "../../components/Footer";
import UserHeader from "../../pages/UserView/UserHeader";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// "Legs & Chest" -> "legs-chest"
function slugify(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const DEFAULT_IMG = "/img/membershipImage.png";

export default function Classes({ user, setUser }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [types, setTypes] = useState(null); // null = loading
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !user.Role) return;
    if (user.Role !== "user") navigate("/" + user.Role);
  }, [user, navigate]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get("/user/class-types");
        if (!alive) return;
        setTypes(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(
          "GET /user/class-types failed:",
          e?.response?.status,
          e?.response?.data || e?.message
        );
        setError("Could not load class types. Showing an empty list for now.");
        setTypes([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!user || !user.Role) return null;
  if (user.Role !== "user") return null;

  const getImageForType = (typeText) =>
    `/img/classtypes/${slugify(typeText)}.png`;
  const handleImgError = (e) => {
    e.currentTarget.src = DEFAULT_IMG;
  };

  return (
    <>
      <UserHeader
        user={user}
        setUser={setUser}
        onProfile={() => setShowProfile(true)}
      />

      <div className={styles.classesBg}>
        <h1 className={styles.title}>
          <span>Our</span> Classes
        </h1>

        {/* General intro + policies */}
        <div className={styles.welcomeBox}>
          <h2>Welcome to REFiT</h2>
          <p>
            Each class is about <b>1 hour</b> and led by experienced trainers
            with different specialties. We’re open daily from <b>6:00 AM</b> to{" "}
            <b>11:00 PM</b>.
          </p>
          <div className={styles.policyBox}>
            <ul>
              <li>
                If you cancel a booked class, we return <b>1 class credit</b> to
                your balance.
              </li>
              <li>
                You can <b>cancel membership anytime</b>.
              </li>
            </ul>
          </div>
          <p>Browse the available training options below.</p>
        </div>

        {types === null && (
          <div className={styles.loadingBox}>Loading class types…</div>
        )}
        {error && <div className={styles.errorBox}>{error}</div>}

        {/* Scrollable GRID (3 per row on desktop) */}
        <div className={styles.gridWrap}>
          {Array.isArray(types) && types.length === 0 && (
            <div className={styles.emptyBox}>
              No class types yet. Check back soon.
            </div>
          )}

          {Array.isArray(types) && types.length > 0 && (
            <div className={styles.cardsGridScroll}>
              {types.map((t) => (
                <div key={t.id} className={styles.card}>
                  <img
                    src={getImageForType(t.type)}
                    alt={t.type}
                    className={styles.cardImg}
                    onError={handleImgError}
                  />
                  <h2 className={styles.cardTitle}>{t.type}</h2>
                  <p className={styles.cardDesc}>
                    Max participants: {t.MaxParticipants}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Register membership section */}
        <div className={styles.registerBox}>
          <p className={styles.registerMsg}>
          Reigster a membership to start booking classes and to have access to all members featuers!          </p>
          <button
            className={styles.registerBtn}
            onClick={() => navigate("/register-membership")}
          >
            Register for Membership
          </button>
        </div>

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
