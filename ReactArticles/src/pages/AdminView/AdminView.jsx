import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import AdminHeader from "./AdminHeader";
import Footer from "../../components/Footer";
import classes from "./AdminView.module.css";

export default function AdminView() {
    const navigate = useNavigate();
    const [showContent, setShowContent] = useState(false);
    const [name, setName] = useState("");
    const [pendingTrainers, setPendingTrainers] = useState([]);
    const [statusMsg, setStatusMsg] = useState("");
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalTrainers: 0,
        pendingTrainers: 0
    });

    const fetchDashboardStats = useCallback(async () => {
        setStats(prev => ({ ...prev }));
    }, []);

    useEffect(() => {
        axios.get("/whoami", { withCredentials: true })
            .then(res => {
                setName(res.data.FirstName + " " + res.data.LastName);
                if (res.data.Role !== 'admin') {
                    navigate("/" + res.data.Role);
                } else {
                    setShowContent(true);
                    fetchDashboardStats();
                }
            })
            .catch(() => {
                navigate("/login");
            });
    }, [navigate, fetchDashboardStats]);

    useEffect(() => {
        if (showContent) {
            axios.get("/admin/pending-trainers")
                .then(res => {
                    setPendingTrainers(res.data);
                    setStats(prev => ({
                        ...prev,
                        pendingTrainers: res.data.length
                    }));
                })
                .catch(() => setPendingTrainers([]));
        }
    }, [showContent, statusMsg]);

    function handleApprove(userId) {
        setStatusMsg("");
        axios.post(`/admin/approve-trainer`, { UserID: userId })
            .then(() => {
                setStatusMsg({ type: "success", message: "Trainer approved successfully!" });
                setPendingTrainers(pendingTrainers.filter(t => t.UserID !== userId));
                setStats(prev => ({
                    ...prev,
                    pendingTrainers: prev.pendingTrainers - 1,
                    totalTrainers: prev.totalTrainers + 1
                }));
            })
            .catch(() => setStatusMsg({ type: "error", message: "Error approving trainer." }));
    }

    function handleReject(userId) {
        setStatusMsg("");
        axios.post(`/admin/reject-trainer`, { UserID: userId })
            .then(() => {
                setStatusMsg({ type: "success", message: "Trainer rejected successfully!" });
                setPendingTrainers(pendingTrainers.filter(t => t.UserID !== userId));
                setStats(prev => ({
                    ...prev,
                    pendingTrainers: prev.pendingTrainers - 1
                }));
            })
            .catch(() => setStatusMsg({ type: "error", message: "Error rejecting trainer." }));
    }

    if (!showContent) return (
        <div className={classes.loadingContainer}>
            <div className={classes.loadingSpinner}></div>
            <p>Loading dashboard...</p>
        </div>
    );

    return (
        <div className={classes.adminContainer}>
            <AdminHeader />
            <main>
                <section className={classes.welcomeSection}>
                    <h1 className={classes.welcomeTitle}>Welcome back, {name}!</h1>
                    <p className={classes.welcomeSubtitle}>Here's what's happening with your gym today.</p>
                </section>

                {statusMsg && (
                    <div className={`${classes.statusMessage} ${classes[`statusMessage${statusMsg.type}`]}`}>
                        {statusMsg.type === 'success' ? (
                            <>
                                <span>✓</span> {statusMsg.message}
                            </>
                        ) : (
                            <>
                                <span>⚠</span> {statusMsg.message}
                            </>
                        )}
                    </div>
                )}

                {/* Pending Trainers Section */}
                <h2 className={classes.sectionTitle}>Pending Trainer Approvals</h2>
                {pendingTrainers.length > 0 ? (
                    <div className={classes.pendingTrainersGrid}>
                        {pendingTrainers.map(trainer => (
                            <div key={trainer.UserID} className={classes.trainerCard}>
                                <div className={classes.trainerName}>
                                    ⏳ {trainer.FirstName} {trainer.LastName}
                                </div>
                                <div className={classes.trainerDetail}><b>Email:</b> {trainer.Email}</div>
                                <div className={classes.trainerDetail}><b>Phone:</b> {trainer.Phone}</div>
                                <div className={classes.trainerDetail}><b>Date of Birth:</b> {trainer.DateOfBirth?.slice(0,10)}</div>
                                <div className={classes.trainerDetail}><b>Availability:</b> {trainer.Availability}</div>
                                <div className={classes.trainerDetail}>
                                    <b>Certification:</b>{" "}
                                    <a
                                        href={`http://localhost:8801/admin/trainer-cert/${trainer.UserID}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={classes.certLink}
                                    >
                                        View/Download
                                    </a>
                                </div>
                                <div className={classes.trainerActions}>
                                    <button 
                                        className={`${classes.button} ${classes.buttonPrimary}`}
                                        onClick={() => handleApprove(trainer.UserID)}
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        className={`${classes.button} ${classes.buttonDanger}`}
                                        onClick={() => handleReject(trainer.UserID)}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={classes.emptyState}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#e0e0e0' }}>✓</div>
                        <p>No pending trainer approvals at the moment.</p>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
