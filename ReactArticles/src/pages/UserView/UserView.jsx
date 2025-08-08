import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UserView.module.css";
import UserHeader from "./UserHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import { FaCreditCard, FaDumbbell, FaUserAlt, FaQuoteLeft, FaInfoCircle } from "react-icons/fa";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

const testimonials = [
  {
    name: "Sami T.",
    text: "Refit Gym changed my life. The trainers are motivating and the classes are always fun!",
  },
  {
    name: "Maya L.",
    text: "I love the flexibility and variety. I finally look forward to my workouts.",
  },
  {
    name: "Omar D.",
    text: "Best gym atmosphere. Clean, modern, and friendly staff!",
  },
];

export default function UserView({ user, setUser }) {
  const navigate = useNavigate();
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!user || !user.Role) {
      navigate("/login");
    } else if (user.Role !== "user") {
      navigate("/" + user.Role);
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!user || !user.Role || user.Role !== "user") return null;

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
            transition: "opacity 1.2s"
          }}
        />
      ))}
      <div className={styles.overlay} />
      <UserHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />
      <main className={styles.mainContent}>
        <div className={styles.entryContent}>
          {/* RIGHT Panel: Welcome, quick links, motivation */}
          <section className={styles.rightPanel}>
            <div className={styles.welcomeSection}>
              <div className={styles.userAvatar}>
                <FaUserAlt size={52} color="#6ea8ff" />
              </div>
              <h1 className={styles.welcomeTitle}>
                Welcome,{" "}
                <span className={styles.highlight}>
                  {user ? (user.FirstName || "") + " " + (user.LastName || "") : ""}
                </span>
              </h1>
              <p className={styles.welcomeText}>
                Ready to take your fitness to the next level?
                <span className={styles.subText}>
                  Unlock all Refit features by becoming a member!
                </span>
              </p>
            </div>
            <div className={styles.quickLinks}>
              <button className={styles.quickBtn}
                onClick={() => navigate("/register-membership")}
                title="Become a Member"
              >
                <FaCreditCard className={styles.quickIcon} />
                Become a Member
              </button>
              <button className={styles.quickBtn}
                onClick={() => navigate("/classes")}
                title="Explore Classes"
              >
                <FaDumbbell className={styles.quickIcon} />
                Explore Classes
              </button>
              <button className={styles.quickBtn}
                onClick={() => navigate("/about")}
                title="About Refit Gym"
              >
                <FaInfoCircle className={styles.quickIcon} />
                About Refit
              </button>
            </div>
            <div className={styles.motivationCard}>
              <FaQuoteLeft className={styles.motivationIcon} />
              <div className={styles.motivationQuote}>
                "The only bad workout is the one you didn't do."
              </div>
            </div>
            <div className={styles.testimonialSection}>
              <div className={styles.testimonialTitle}>What Our Members Say</div>
              <div className={styles.testimonialList}>
                {testimonials.map((item, i) => (
                  <div key={i} className={styles.testimonialCard}>
                    <div className={styles.testimonialText}>
                      "{item.text}"
                    </div>
                    <div className={styles.testimonialName}>
                      — {item.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* LEFT Panel: Why Choose Refit & CTA */}
          <section className={styles.leftPanel}>
            <div className={styles.whySection}>
              <h2 className={styles.whyTitle}>Why Choose Refit?</h2>
              <ul className={styles.whyList}>
                <li>Professional, certified trainers</li>
                <li>Flexible class schedules</li>
                <li>Family-friendly and inclusive environment</li>
                <li>Modern, clean equipment</li>
                <li>Central location with free parking</li>
              </ul>
            </div>
            <div className={styles.ctaCard}>
              <div className={styles.ctaTitle}>
                🎫 Become a Refit Member
              </div>
              <ul className={styles.ctaList}>
                <li>✓ Book group and personal classes online</li>
                <li>✓ Access class history and track progress</li>
                <li>✓ Fast, secure payments</li>
                <li>✓ Special offers for members</li>
              </ul>
              <button
                className={styles.ctaBtn}
                onClick={() => navigate("/register-membership")}
              >
                Register Membership
              </button>
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
