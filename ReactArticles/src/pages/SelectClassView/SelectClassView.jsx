import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

export default function SelectClass() {
  const location = useLocation();
  const { selectedType, selectedDate } = location.state || {};
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    axios.post("http://localhost:8801/member/classes-with-trainers", {
      typeId: selectedType,
      date: selectedDate
    }, { withCredentials: true })
      .then(res => {
        setClasses(res.data);
      })
      .catch(err => console.error("Failed to fetch filtered classes:", err));
  }, [selectedType, selectedDate]);

  return (
    <div>
      <h2>Matching Classes</h2>
      {classes.length === 0 ? (
        <p>No classes found for the selected criteria.</p>
      ) : (
        classes.map(cls => (
          <div key={cls.ClassID}>
            <p><strong>Class ID:</strong> {cls.ClassID}</p>
            <p><strong>Date:</strong> {new Date(cls.Schedule).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {cls.time ? cls.time.slice(0, 5) : "N/A"}</p>
            <p><strong>Trainer ID:</strong> {cls.UserID}</p>
            <p><strong>Reviews:</strong> {cls.Reviews}</p>
            <p><strong>Ratings:</strong> {cls.Ratings}</p>
            <hr />
          </div>
        ))
      )}
    </div>
  );
}
