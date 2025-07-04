import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./MyMemberShip.module.css";
import { FaCrown, FaGem, FaRegClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import MemberHeader from "../MemberView/MemberHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString('en-GB');
}

export default function MyMembership({ user, setUser }) {
  const [membership, setMembership] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.Role) return;
    if (user.Role !== "member") {
      navigate("/" + user.Role);
    } else {
      setAuthorized(true);
    }
  }, [user, navigate]);

  useEffect(() => {
    axios.get("/member/my-membership", { withCredentials: true })
      .then(res => {
        setMembership(res.data);
        setLoading(false);
        const today = new Date();
        const end = new Date(res.data.EndDate);
        setDaysLeft(Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24))));
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleCancelMembership() {
    try {
      await axios.post("/member/cancel-membership", {}, { withCredentials: true });
      await axios.post("/logout", {}, { withCredentials: true });

      setUser({});
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setErrorMessage("Failed to cancel membership. Please try again.");
    }
    setShowCancelModal(false);
  }

  const accentClass =
    membership?.PlanName === "Premium"
      ? styles.premiumAccent
      : membership?.PlanName === "Standard"
      ? styles.standardAccent
      : styles.basicAccent;

  if (loading) return <div>Loading membership...</div>;
  if (!membership) return <div>No active membership found.</div>;
  if (!authorized) return null;

  return (
    <div className={styles.pageWrapper}>
      <MemberHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />
      <div className={styles.bgImage}></div>
      <div className={styles.overlay}></div>
      <div className={styles.container}>
        <div className={`${styles.card} ${accentClass}`}>
          <div className={styles.header}>
            {membership.PlanName === "Premium" && <FaGem className={styles.icon} />}
            {membership.PlanName === "Standard" && <FaCrown className={styles.icon} />}
            {membership.PlanName === "Basic" && <FaRegClock className={styles.icon} />}
            <h2>{membership.PlanName} Membership</h2>
          </div>
          <div className={styles.details}>
            <div><b>Start Date:</b> {formatDate(membership.StartDate)}</div>
            <div><b>End Date:</b> {formatDate(membership.EndDate)}</div>
            <div>
              <b>Days Left:</b>{" "}
              <span className={daysLeft <= 7 ? styles.expiring : ""}>{daysLeft} days</span>
            </div>
            <div><b>Classes Left:</b> {membership.ClassAmount}</div>
          </div>

          {errorMessage && <div className={styles.errorMsg}>{errorMessage}</div>}

          <button
            className={styles.cancelBtn}
            onClick={() => setShowCancelModal(true)}
          >
            Cancel Membership
          </button>
        </div>
      </div>

      {/* Modal Popup */}
      {showCancelModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Cancel Membership?</h3>
            <p>
              If you cancel your membership, <b>all saved class credits will be lost</b> and you will have to register again to access member features.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={handleCancelMembership}
              >
                Yes, Cancel Membership
              </button>
              <button
                className={styles.cancelCancelBtn}
                onClick={() => setShowCancelModal(false)}
              >
                No, Keep Membership
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfileModal
        show={showProfile}
        onClose={() => setShowProfile(false)}
        userData={user}
        onUpdate={setUser}
      />
      <Footer />
    </div>
  );
}
