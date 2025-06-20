import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MemberView.module.css";
import MemberHeader from "./MemberHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import axios from "axios";

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
  const classY = classDateTime.getFullYear();
  const classM = classDateTime.getMonth();
  const classD = classDateTime.getDate();

  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    return weekNo;
  }
  const nowWeek = getWeekNumber(now);
  const classWeek = getWeekNumber(classDateTime);

  if (todayY === classY && todayM === classM && todayD === classD) {
    return "Today";
  } else if (
    classY === todayY &&
    classWeek === nowWeek &&
    classDateTime > now
  ) {
    return "This Week";
  } else if (
    (classY === todayY && classWeek === nowWeek + 1) ||
    (classY === todayY + 1 && nowWeek === 52 && classWeek === 1)
  ) {
    return "Next Week";
  }
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

  // All upcoming classes in gym
  const [allUpcomingClasses, setAllUpcomingClasses] = useState([]);
  const [loadingAllUpcoming, setLoadingAllUpcoming] = useState(true);

  useEffect(() => {
    if (!user || !user.Role) {
      navigate("/login");
    } else if (user.Role !== "member") {
      navigate("/" + user.Role);
    }
  }, [user, navigate]);

  // MEMBERSHIP CARD
  const [membership, setMembership] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(true);

  // CLASS ATTENDANCE
  const [attendance, setAttendance] = useState(0);

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

  useEffect(() => {
    if (!authorized) return;
    setFetchingClasses(true);
    axios.get("/member/my-booked-classes", { withCredentials: true })
      .then(res => res.data)
      .then(data => {
        setClasses(Array.isArray(data) ? data : []);
        setAttendance(Array.isArray(data) ? data.filter(cls => {
          // Only classes in the past
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

  // Fetch all upcoming classes in gym (not just member's)
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

  // MEMBERSHIP CARD: fetch membership info
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

  // MEMBERSHIP CARD: calculate days left
  let daysLeft = null;
  if (membership && membership.StartDate && membership.EndDate) {
    const end = new Date(membership.EndDate);
    const today = new Date();
    end.setHours(0,0,0,0); today.setHours(0,0,0,0);
    daysLeft = Math.max(0, Math.round((end - today) / (1000 * 60 * 60 * 24)));
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

          {/* --- TOP BAR ROW --- */}
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
            {/* --- 1. Your Booked Upcoming Classes --- */}
            <section className={styles.classesSection}>
              <h2 className={styles.sectionTitle}>My Upcoming Classes</h2>
              {fetchingClasses ? (
                <div className={styles.loadingMsg}>Loading classes...</div>
              ) : upcomingClasses.length === 0 ? (
                <div className={styles.noClassesMsg}>
                  No upcoming classes
                </div>
              ) : (
                <div className={styles.classListHorizontal}>
                  {upcomingClasses.map(cls => (
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

            {/* === 2. All Upcoming Classes in Gym (not just your bookings) === */}
            <section className={styles.classesSection}>
              <h2 className={styles.sectionTitle}>All Upcoming Classes</h2>
              {loadingAllUpcoming ? (
                <div className={styles.loadingMsg}>Loading all classes...</div>
              ) : allUpcomingClasses.length === 0 ? (
                <div className={styles.noClassesMsg}>
                  No upcoming classes in the gym
                </div>
              ) : (
                <div className={styles.classListHorizontal}>
                  {allUpcomingClasses.map(cls => (
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

            {/* --- 3. Past Class History --- */}
            <section className={styles.classesSection}>
              <h2 className={styles.sectionTitle}>My Class History</h2>
              {fetchingClasses ? (
                <div className={styles.loadingMsg}>Loading history...</div>
              ) : pastClasses.length === 0 ? (
                <div className={styles.noClassesMsg}>
                  No class history yet
                </div>
              ) : (
                <div className={styles.classListHorizontal}>
                  {pastClasses.map(cls => (
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
