import React, { useState, useEffect } from "react";
import axios from "axios";
export default function ClassesPage() {
    const [classTypes, setClassTypes] = useState([]);
    const [newType, setNewType] = useState("");
    const [newMax, setNewMax] = useState(10);
    const [setAllMax, setSetAllMax] = useState(10);
  
    // Load all class types on mount
    useEffect(() => {
      fetchClassTypes();
    }, []);
  
    function fetchClassTypes() {
      axios.get("/api/class-types")
        .then(res => setClassTypes(res.data))
        .catch(err => alert("Failed to load class types"));
    }
  
    // Delete handler
    function handleDelete(id) {
      if (!window.confirm("Are you sure?")) return;
      axios.delete(`/api/class-types/${id}`)
        .then(fetchClassTypes)
        .catch(() => alert("Delete failed"));
    }
  
    // Add handler
    function handleAdd(e) {
      e.preventDefault();
      axios.post("/api/class-types", { type: newType, MaxParticipants: Number(newMax) })
        .then(() => {
          setNewType("");
          setNewMax(10);
          fetchClassTypes();
        })
        .catch(() => alert("Add failed"));
    }
  
    // Set all MaxParticipants
    function handleSetAllMax() {
      axios.put("/api/class-types/set-max", { max: Number(setAllMax) })
        .then(fetchClassTypes)
        .catch(() => alert("Failed to set all MaxParticipants"));
    }
  
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto" }}>
        <h2>Class Types Management</h2>
        <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
          <input
            type="text"
            value={newType}
            onChange={e => setNewType(e.target.value)}
            placeholder="Class type"
            required
          />
          <input
            type="number"
            value={newMax}
            onChange={e => setNewMax(e.target.value)}
            min={1}
            required
            style={{ width: 70, marginLeft: 8 }}
          />
          <button type="submit" style={{ marginLeft: 8 }}>Add Class Type</button>
        </form>
  
        <div style={{ marginBottom: 24 }}>
          <input
            type="number"
            value={setAllMax}
            onChange={e => setSetAllMax(e.target.value)}
            min={1}
            style={{ width: 70 }}
          />
          <button onClick={handleSetAllMax} style={{ marginLeft: 8 }}>
            Set All MaxParticipants
          </button>
        </div>
  
        <table border="1" cellPadding="8" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Max Participants</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {classTypes.map(ct => (
              <tr key={ct.id}>
                <td>{ct.id}</td>
                <td>{ct.type}</td>
                <td>{ct.MaxParticipants}</td>
                <td>
                  <button onClick={() => handleDelete(ct.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  