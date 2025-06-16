import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MemberView.module.css";
import MemberHeader from "./MemberHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

export default function MemberView({ user, setUser }) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  // User auth logic: null or missing role means "not logged in"
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

  if (loading) {
    return (
      <div className={styles.bgWrapper} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ color: "#fff", fontSize: "2rem" }}>Loading...</div>
      </div>
    );
  }

  // Redirect to login ONLY if not authorized
  if (!authorized) {
    navigate("/login");
    return null;
  }

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
        <div className={styles.welcomeContainer}>
          <h1 className={styles.welcomeTitle}>
            Welcome Back, <span className={styles.highlight}>{(user.FirstName || "") + " " + (user.LastName || "")}</span>!
          </h1>
          <p className={styles.welcomeText}>
            All your class info, bookings, and progress — right here in your Refit member area.
          </p>
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
