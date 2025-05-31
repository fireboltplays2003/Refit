import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function BookView() {
  const [classTypes, setClassTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:8801/member/class-types", { withCredentials: true })
      .then(res => setClassTypes(res.data))
      .catch(err => console.error("Failed to fetch class types:", err));
  }, []);

  const handleSubmit = () => {
    if (!selectedType || !selectedDate) {
      alert("Please choose both type and date.");
      return;
    }
    navigate("/member/select-class", {
      state: {
        selectedType: parseInt(selectedType),
        selectedDate
      }
    });
  };

  return (
    <div>
      <h2>Select a Class</h2>
      <label>Class Type:</label>
      <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
        <option value="">-- Select --</option>
        {classTypes.map(type => (
          <option key={type.id} value={type.id}>{type.type}</option>
        ))}
      </select>

      <br />

      <label>Date:</label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      <br /><br />
      <button onClick={handleSubmit}>Confirm</button>
    </div>
  );
}