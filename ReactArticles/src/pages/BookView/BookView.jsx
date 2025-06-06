import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from './BookView.module.css';
import MemberHeader from "../MemberView/MemberHeader";

// Robust date formatter: always outputs DD/MM/YYYY from ISO
// Replace the existing toDisplayDate function with this one:
function toDisplayDate(isoDate) {
  if (!isoDate) return "";
  try {
    // Create a date object from the ISO string
    const date = new Date(isoDate);
    
    // Get local date components
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid date";
  }
}

export default function BookView() {
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

  // Load PayPal script
  useEffect(() => {
    if (paypalScriptLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=AYHk_RKasr6nntaQY1qj9Gr4ftu1xpACfC11Bb1OPboYvJ8kaw_hZrE5V2V9-sZtzdnJaNM_ctUggH1V";
    script.addEventListener("load", () => setPaypalReady(true));
    document.body.appendChild(script);
    paypalScriptLoaded.current = true;
  }, []);

  // Get class types
  useEffect(() => {
    axios.get("http://localhost:8801/member/class-types", { withCredentials: true })
      .then(res => setClassTypes(res.data))
      .catch(() => setError("Failed to fetch class types."));
  }, []);

  // Get class amount
  useEffect(() => {
    axios.get("http://localhost:8801/member/class-amount", { withCredentials: true })
      .then(res => setClassAmount(res.data.classAmount))
      .catch(() => setClassAmount(0));
  }, []);

  // Fetch classes when filters change
  useEffect(() => {
    setClasses([]); // Clear stale classes immediately
    setSelectedClassId(null);
    setError("");
    setMessage("");

    const body = {};
    if (selectedType) body.classTypeName = selectedType;
    if (selectedDate) body.date = selectedDate;
    axios.post("http://localhost:8801/member/classes", body, { withCredentials: true })
      .then(res => {
        setClasses(res.data);
        setError("");
      })
      .catch(() => setError("Failed to fetch classes."));
  }, [selectedType, selectedDate]);

  // Render PayPal button
  useEffect(() => {
    const container = document.getElementById("paypal-button-container");
    if (!paypalReady || !selectedClassId || !container || !window.paypal) return;

    container.innerHTML = "";

    window.paypal.Buttons({
      createOrder: async () => {
        const res = await axios.post("http://localhost:8801/api/paypal/create-order");
        return res.data.id;
      },
      onApprove: async (data) => {
        await axios.post("http://localhost:8801/api/paypal/capture-order", { orderID: data.orderID });
        await axios.post("http://localhost:8801/member/save-booking", { classId: selectedClassId }, { withCredentials: true });
        setMessage("Payment successful and class booked!");
      },
      onError: () => setError("Payment failed.")
    }).render("#paypal-button-container");

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [paypalReady, selectedClassId]);

  const handleClassSelect = (id) => {
    setSelectedClassId(id);
    setMessage("");
    setError("");
  };

  const handleBookWithCredit = async () => {
    if (!selectedClassId) return setError("Please select a class.");
    try {
      await axios.post("http://localhost:8801/member/use-class", {}, { withCredentials: true });
      await axios.post("http://localhost:8801/member/save-booking", { classId: selectedClassId }, { withCredentials: true });
      setClassAmount(prev => prev - 1);
      setMessage("Class booked with class credit!");
      setError("");
    } catch (err) {
      setError("Booking failed. No credits or server error.");
    }
  };

  return (
    <>
      <MemberHeader />
      <div className={styles.bg}>
        <div className={styles.bookingContainer}>
          <h2>Select a Class</h2>
          <label>Class Type:</label>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            <option value="">-- All Types --</option>
            {classTypes.map(type => (
              <option key={type.id} value={type.type}>{type.type}</option>
            ))}
          </select>

          <label>Date:</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />

          <p><strong>Your Class Credits:</strong> {classAmount}</p>
          <div className={styles.classList}>
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
      <strong>Date:</strong> {toDisplayDate(cls.Schedule)} at {cls.time}<br />
      <strong>Trainer:</strong> {cls.TrainerFirstName} {cls.TrainerLastName}
    </button>
  ))}
</div>  

          <br />
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
            {!paypalReady && <p>Loading PayPal button...</p>}
            {paypalReady && !selectedClassId && (
              <p style={{ color: "gray" }}>Select a class to enable PayPal payment.</p>
            )}
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {message && <p style={{ color: "green" }}>{message}</p>}
        </div>
      </div>
    </>
  );
}
