import { useState, useEffect } from "react";
import axios from "axios";
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Typography } from '@mui/material';
import styles from "./ClassTypesManagement.module.css";
import AdminHeader from "../AdminView/AdminHeader";
import ProfileModal from "../../components/ProfileModal";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";

export default function ClassTypesManagement({ user, setUser }) {
  const [classTypes, setClassTypes] = useState([]);
  const [newType, setNewType] = useState("");
  const [newMax, setNewMax] = useState(10);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    if (!user || !user.Role) {
      navigate("/login");
    } else if (user.Role !== "admin") {
      navigate("/" + user.Role);
    }
  }, [user, navigate]);

  
  useEffect(() => {
    fetchClassTypes();
  }, []);

  function fetchClassTypes() {
    axios
      .get("/admin/class-types")
      .then(res => setClassTypes(res.data))
      .catch(err => {
        setErrorMessage("Failed to load class types");
        console.error("Failed to load class types:", err);
      });
  }

  function handleAdd(e) {
    e.preventDefault();
    axios
      .post("/admin/class-types", { type: newType, MaxParticipants: Number(newMax) })
      .then(() => {
        setNewType("");
        setNewMax(10);
        fetchClassTypes(); // Refresh the list
        setSuccessMessage("Class type added successfully!");
      })
      .catch(err => {
        setErrorMessage("Failed to add class type");
        console.error("Add failed:", err);
      });
  }

  function handleUpdateMax(id, newMax) {
    if (newMax < 1) return; // Prevent negative or zero numbers
    axios
      .put(`/admin/class-type/${id}/max`, { MaxParticipants: Number(newMax) })
      .then(() => {
        fetchClassTypes(); // Refresh after updating
        setSuccessMessage("Max participants updated successfully!");
      })
      .catch(err => {
        setErrorMessage("Failed to update max participants");
        console.error("Update failed:", err);
      });
  }

  function handleDelete(id) {
    if (!window.confirm("Are you sure?")) return;
    axios
      .delete(`/admin/class-types/${id}`)
      .then(() => {
        fetchClassTypes(); // Refresh the list
        setSuccessMessage("Class type deleted successfully!");
      })
      .catch(err => {
        setErrorMessage("Failed to delete class type");
        console.error("Delete failed:", err);
      });
  }

  return (
    <>
      <AdminHeader user={user} onProfile={() => setShowProfile(true)} setUser={setUser} />
      <div className={styles.pageWrapper}>
        <Typography variant="h4" gutterBottom className={styles.header}>
          Class Types Management
        </Typography>

        {/* Display success or error messages */}
        <div className={styles.messageWrapper}>
          {successMessage && <div className={styles.successMsg}>{successMessage}</div>}
          {errorMessage && <div className={styles.errorMsg}>{errorMessage}</div>}
        </div>

        <form onSubmit={handleAdd} className={styles.form}>
          <div className={styles.inputWrapper}>
            <TextField
              placeholder="Class Type"
              variant="outlined"
              value={newType}
              onChange={e => setNewType(e.target.value)}
              className={styles.input}
              required
            />
            <TextField
              placeholder="Max Participants"
              variant="outlined"
              type="number"
              value={newMax}
              onChange={e => setNewMax(Math.max(1, e.target.value))} // Ensures value isn't less than 1
              min={1}
              required
              className={styles.input}
            />
          </div>
          <Button type="submit" variant="contained" color="primary" className={styles.submitBtn}>
            Add Class Type
          </Button>
        </form>

        <TableContainer component={Paper} className={styles.tableContainer}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={styles.tableHeader}>ID</TableCell>
                <TableCell className={styles.tableHeader}>Type</TableCell>
                <TableCell className={styles.tableHeader}>Max Participants</TableCell>
                <TableCell className={styles.tableHeader}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classTypes.map(ct => (
                <TableRow key={ct.id}>
                  <TableCell>{ct.id}</TableCell>
                  <TableCell>{ct.type}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={ct.MaxParticipants}
                      onChange={e => handleUpdateMax(ct.id, e.target.value)}
                      min={1}
                      className={styles.input}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleDelete(ct.id)}
                      variant="outlined"
                      color="error"
                      className={styles.deleteBtn}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
