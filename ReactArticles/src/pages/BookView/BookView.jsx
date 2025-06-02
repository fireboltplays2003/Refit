import React, { useState, useEffect } from "react";
import axios from "axios";

// Helper to convert YYYY-MM-DD to DD/MM/YYYY
function toDisplayDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
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

  // Fetch class types on mount
  useEffect(() => {
    axios.get("http://localhost:8801/member/class-types", { withCredentials: true })
      .then(res => setClassTypes(res.data))
      .catch(() => setError("Failed to fetch class types."));
  }, []);

  // Fetch user's class amount on mount
  useEffect(() => {
    axios.get("http://localhost:8801/member/class-amount", { withCredentials: true })
      .then(res => setClassAmount(res.data.classAmount))
      .catch(() => setClassAmount(0)); // Default to 0 on failure
  }, []);

  // Fetch classes whenever filter changes or on first load
  useEffect(() => {
    const body = {};
    if (selectedType) body.typeId = parseInt(selectedType);
    if (selectedDate) body.date = selectedDate;
    axios.post("http://localhost:8801/member/classes", body, { withCredentials: true })
      .then(res => {
        setClasses(res.data);
        setError("");
      })
      .catch(() => setError("Failed to fetch classes."));
  }, [selectedType, selectedDate]);

  // Handler to select a class
  const handleClassSelect = (id) => {
    setSelectedClassId(id);
    setMessage("");
    setError("");
  };

  // Handler for booking with class credits
  const handleBookWithCredit = async () => {
    if (!selectedClassId) {
      setError("Please select a class.");
      return;
    }
    try {
      const res = await axios.post("http://localhost:8801/member/use-class", {}, { withCredentials: true });
      setClassAmount(prev => prev - 1);
      setMessage("Class booked using your class credit!");
      setError("");
    } catch (err) {
      setError("No class credits left. Please use PayPal.");
      setMessage("");
    }
  };

  // Handler for PayPal booking (placeholder)
  const handleBookWithPaypal = () => {
    if (!selectedClassId) {
      setError("Please select a class.");
      setMessage("");
      return;
    }
    setMessage("Proceed to PayPal payment flow... (not implemented)");
    setError("");
    // You'd redirect or open PayPal payment logic here.
  };

  return (
    <div>
      <h2>Select a Class</h2>
      <label>Class Type:</label>
      <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
        <option value="">-- All Types --</option>
        {classTypes.map(type => (
          <option key={type.id} value={type.id}>{type.type}</option>
        ))}
      </select>
      <br />
      <label>Date:</label>
      <input
        type="date"
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
      />
      <br /><br />
      <p>
        <strong>Your Class Credits:</strong> {classAmount}
      </p>
      <h3>Available Classes</h3>
      {classes.length === 0 ? (
        <p>No classes found for the selected criteria.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {classes.map(cls => (
            <button
              key={cls.ClassID}
              onClick={() => handleClassSelect(cls.ClassID)}
              style={{
                border: selectedClassId === cls.ClassID ? "2px solid blue" : "1px solid gray",
                background: selectedClassId === cls.ClassID ? "#e0f0ff" : "white",
                textAlign: "left",
                padding: "10px",
                cursor: "pointer"
              }}
            >
              <strong>Class ID:</strong> {cls.ClassID}<br />
              <strong>Type:</strong> {cls.ClassType}<br />
              <strong>Date:</strong> {toDisplayDate(cls.Schedule.split("T")[0] || cls.Schedule)}<br />
              <strong>Time:</strong> {cls.time ? cls.time.slice(0, 5) : "N/A"}<br />
              <strong>Trainer:</strong> {cls.TrainerFirstName} {cls.TrainerLastName}<br />
              <strong>Email:</strong> {cls.TrainerEmail}<br />
              <strong>Max Participants:</strong> {cls.MaxParticipants}
            </button>
          ))}
        </div>
      )}

      <br />
      <button onClick={handleBookWithCredit} disabled={classAmount <= 0 || !selectedClassId}>
        Book with Class Credit
      </button>
      <button onClick={handleBookWithPaypal} style={{ marginLeft: "8px" }}>
        Book with PayPal
      </button>

      <br /><br />
      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
    </div>
  );
}
