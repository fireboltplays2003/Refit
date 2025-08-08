import { useState } from "react";
import styles from "./About.module.css";
import UserHeader from "../../pages/UserView/UserHeader";
import MemberHeader from "../../pages/MemberView/MemberHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";

export default function About({ user, setUser }) {
  const [showProfile, setShowProfile] = useState(false);

  // Choose header based on role
  let header = null;
  if (user && user.Role === "member") {
    header = (
      <MemberHeader
        user={user}
        setUser={setUser}
        onProfile={() => setShowProfile(true)}
      />
    );
  } else if (user && user.Role === "user") {
    header = (
      <UserHeader
        user={user}
        setUser={setUser}
        onProfile={() => setShowProfile(true)}
      />
    );
  }

  return (
    <>
      {header}
      <div className={styles.aboutWrapper}>
        <main className={styles.mainContent}>
          <div className={styles.aboutCard}>
            <h1 className={styles.aboutTitle}>About Refit Gym</h1>
            <p className={styles.aboutText}>
              <b>Refit Gym</b> is dedicated to helping you reach your fitness goals in a modern, supportive environment.
            </p>
            <ul className={styles.aboutList}>
              <li>State-of-the-art fitness equipment</li>
              <li>Wide variety of group and personal classes</li>
              <li>Expert trainers focused on your progress</li>
              <li>Easy-to-use online booking and membership system</li>
            </ul>
            <p className={styles.aboutText}>
              Whether you are a beginner or a seasoned athlete, our facilities and staff are here to support every step of your journey.
            </p>
          </div>

          {/* Founders Section */}
          <div className={styles.foundersSection}>
            <h2 className={styles.foundersTitle}>Meet Our Founders</h2>
            <div className={styles.foundersGrid}>
              {/* Founder 1 */}
              <div className={styles.founderCard}>
                <img
                  src="/img/Owner1.png"
                  alt="Owner 1"
                  className={styles.founderImg}
                  loading="lazy"
                />
                <div className={styles.founderInfo}>
                  <div className={styles.founderName}>Stephanos Khoury</div>
                  <div className={styles.founderRole}>Co-Founder & Lead Developer</div>
                  <div className={styles.founderBio}>
                    Passionate about technology, fitness, and empowering members through a seamless gym experience.
                  </div>
                </div>
              </div>
              {/* Founder 2 */}
              <div className={styles.founderCard}>
                <img
                  src="/img/Owner2.png"
                  alt="Owner 2"
                  className={styles.founderImg}
                  loading="lazy"
                />
                <div className={styles.founderInfo}>
                  <div className={styles.founderName}>Elias Dabbagh</div>
                  <div className={styles.founderRole}>Co-Founder & Operations</div>
                  <div className={styles.founderBio}>
                    Dedicated to building a welcoming, community-driven space where everyone can achieve their best.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        {/* Profile modal */}
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
