import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from './BookView.module.css';
import MemberHeader from "../MemberView/MemberHeader";
import ProfileModal from "../../components/ProfileModal";
import Footer from "../../components/Footer";

const CLASS_PRICE = 120;

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

export default function BookView({ user, setUser }) {
  const [membershipType, setMembershipType] = useState("standard");
  const [classTypes, setClassTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classAmount, setClassAmount] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalScriptLoaded = useRef(false);

  const [membershipInfo, setMembershipInfo] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const [bookedClassIds, setBookedClassIds] = useState([]);
  const [bookedLoading, setBookedLoading] = useState(true);

  useEffect(() => {
    setBookedLoading(true);
    axios.get("/member/my-booked-classes", { withCredentials: true })
      .then(res => {
        const ids = Array.isArray(res.data)
          ? res.data.map(cls => String(cls.ClassID))
          : [];
        setBookedClassIds(ids);
      })
      .catch(() => setBookedClassIds([]))
      .finally(() => setBookedLoading(false));
  }, []);

  useEffect(() => {
    axios.get("/member/my-membership", { withCredentials: true })
      .then(res => {
        setMembershipInfo(res.data);
        let t = res.data?.PlanName?.toLowerCase() || "basic";
        if (t === "premium") setMembershipType("premium");
        else if (t === "basic") setMembershipType("basic");
        else setMembershipType("standard");
      })
      .catch(() => {
        setMembershipType("basic");
        setMembershipInfo(null);
      });
  }, []);

  useEffect(() => {
    if (paypalScriptLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=AYHk_RKasr6nntaQY1qj9Gr4ftu1xpACfC11Bb1OPboYvJ8kaw_hZrE5V2V9-sZtzdnJaNM_ctUggH1V&currency=ILS";
    script.addEventListener("load", () => setPaypalReady(true));
    document.body.appendChild(script);
    paypalScriptLoaded.current = true;
  }, []);

  useEffect(() => {
    axios.get("/member/class-types", { withCredentials: true })
      .then(res => setClassTypes(res.data))
      .catch(() => setError("Failed to fetch class types."));
  }, []);

  useEffect(() => {
    axios.get("/member/class-amount", { withCredentials: true })
      .then(res => setClassAmount(res.data.classAmount))
      .catch(() => setClassAmount(0));
  }, []);

  // === FILTERS PAST CLASSES (fix) ===
  useEffect(() => {
    if (bookedLoading) {
      setClasses([]);
      return;
    }
    setClasses([]);
    setSelectedClassId(null);
    setError("");
    setMessage("");
    const body = {};
    if (selectedType) body.classTypeName = selectedType;
    if (selectedDate) body.date = selectedDate;

    axios.post("/member/classes", body, { withCredentials: true })
      .then(res => {
        let filteredClasses = res.data;

        // Only classes with spots left
        filteredClasses = filteredClasses.filter(cls => {
          if (cls.MaxParticipants < 1) return false;
          return cls.bookedCount < cls.MaxParticipants;
        });

        // FILTER OUT CLASSES IN THE PAST (BY DATE + TIME)
        const now = new Date();
        filteredClasses = filteredClasses.filter(cls => {
          const classDateTime = new Date(`${cls.Schedule}T${cls.time || "00:00"}`);
          return classDateTime >= now;
        });

        // Don't show classes after membership end date
        const endDate = membershipInfo?.EndDate;
        if (endDate) {
          filteredClasses = filteredClasses.filter(cls => {
            const classDate = typeof cls.Schedule === "string"
              ? cls.Schedule.slice(0, 10)
              : new Date(cls.Schedule).toISOString().slice(0, 10);
            return classDate <= endDate;
          });
        }

        // Don't show classes already booked
        filteredClasses = filteredClasses.filter(
          cls => !bookedClassIds.includes(String(cls.ClassID))
        );
        setClasses(filteredClasses);
      })
      .catch(() => setError("Failed to fetch classes."));
  }, [selectedType, selectedDate, membershipInfo, bookedClassIds, bookedLoading]);

  useEffect(() => {
    const container = document.getElementById("paypal-button-container");
    if (!paypalReady || !selectedClassId || !container || !window.paypal) return;
    container.innerHTML = "";

    window.paypal.Buttons({
      createOrder: async () => {
        const res = await axios.post("/api/paypal/create-order", {
          amount: CLASS_PRICE
        });
        return res.data.id;
      },
      onApprove: async (data) => {
        await axios.post("/api/paypal/capture-order", { orderID: data.orderID });
        await axios.post("/member/save-booking", { classId: selectedClassId }, { withCredentials: true });
        setClasses(prev => prev.filter(c => c.ClassID !== selectedClassId));
        setMessage("Payment successful and class booked!");
        setSelectedClassId(null);
      },
      onError: () => setError("Payment failed.")
    }).render("#paypal-button-container");

    return () => { if (container) container.innerHTML = ""; };
  }, [paypalReady, selectedClassId]);

  const handleClassSelect = (id) => {
    setSelectedClassId(id);
    setMessage("");
    setError("");
  };

  const handleBookWithCredit = async () => {
    if (!selectedClassId) return setError("Please select a class.");
    try {
      await axios.post("/member/use-class", {}, { withCredentials: true });
      await axios.post("/member/save-booking", { classId: selectedClassId }, { withCredentials: true });
      setClassAmount(prev => prev - 1);
      setClasses(prev => prev.filter(c => c.ClassID !== selectedClassId));
      setMessage("Class booked with class credit!");
      setError("");
      setSelectedClassId(null);
    } catch {
      setError("Booking failed. No credits or server error.");
    }
  };

  const accent =
    membershipType === "premium"
      ? styles.premiumAccent
      : membershipType === "basic"
      ? styles.basicAccent
      : styles.standardAccent;

  return (
    <>
      <MemberHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />
      <div className={styles.bg}>
        <div className={styles.bgImage}></div>
        <div className={styles.overlay}></div>
        <div className={`${styles.bookingContainer} ${accent}`}>
          <h2>Select a Class</h2>
          <label>Class Type:</label>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            <option value="">-- All Types --</option>
            {classTypes.map(type => (
              <option key={type.id} value={type.type}>{type.type}</option>
            ))}
          </select>

          <label>Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />

          <p className={styles.classCredits}>
            <strong>Your Class Credits: </strong> {classAmount}
          </p>

          {bookedLoading ? (
            <div style={{ color: "#ccc", fontSize: "1.2rem", margin: "2rem auto" }}>
              Loading available classes...
            </div>
          ) : (
            <div className={styles.classList}>
              {classes.length === 0 && <div style={{ color: "#eee", margin: "2rem auto" }}>No available classes</div>}
              {classes.map(cls => (
                <button
                  key={cls.ClassID}
                  onClick={() => handleClassSelect(cls.ClassID)}
                  className={
                    styles.classButton + " " +
                    (selectedClassId === cls.ClassID ? styles.classButtonSelected : "")
                  }
                  type="button"
                >
                  <strong>Type:</strong> {cls.ClassType}<br />
                  <strong>Date:</strong> {toDisplayDate(cls.Schedule)} at {cls.time.slice(0, 5)}<br />
                  <strong>Trainer:</strong> {cls.TrainerFirstName} {cls.TrainerLastName}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleBookWithCredit}
            disabled={classAmount <= 0 || !selectedClassId}
            className={styles.creditBtn}
          >
            Book with Class Credit
          </button>
          <div className={styles.paypalSection}>
            <h3>Or Pay with PayPal:</h3>
            <div
              id="paypal-button-container"
              style={{ marginTop: "12px" }}
              key={selectedClassId || "none"}
            ></div>
            {selectedClassId && (
              <div style={{ margin: "12px 0 0 0", color: "#6ea8ff", fontWeight: "bold", fontSize: "1.22rem" }}>
                Price to pay: {CLASS_PRICE} ₪
              </div>
            )}
            {!paypalReady && <p className={styles.paypalMsg}>Loading PayPal button...</p>}
            {paypalReady && !selectedClassId && (
              <p className={styles.paypalMsg}>Select a class to enable PayPal payment.</p>
            )}
          </div>
          {error && <p className={styles.errorMsg}>{error}</p>}
          {message && <p className={styles.successMsg}>{message}</p>}
        </div>
      </div>
      <Footer />
      <ProfileModal
        show={showProfile}
        onClose={() => setShowProfile(false)}
        userData={user}
        onUpdate={setUser}
      />
    </>
  );
}
