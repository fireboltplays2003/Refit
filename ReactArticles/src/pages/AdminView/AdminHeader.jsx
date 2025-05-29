import { NavLink, useNavigate } from "react-router-dom";
import classes from "./AdminHeader.module.css";
import axios from "axios";

export default function AdminHeader() {
    const navigate = useNavigate();

    function handleLogout() {
        // Call the server's logout endpoint to destroy the session
        axios.post('http://localhost:8801/logout', {}, { withCredentials: true })
        .then(() => {
            // Clear session cookie just in case
            document.cookie = 'connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            // Redirect
            navigate('/login');
        })
        .catch((error) => {
            alert("Logout failed: " + (error.response?.data?.error || "Unknown error"));
        });
        
        // Clear the session cookie
        document.cookie = 'connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        // Navigate to login page using react-router
        navigate('/login');
    }

    // Function to determine active link class
    const getNavLinkClass = ({ isActive }) => 
        isActive ? `${classes.link} ${classes.active}` : classes.link;

    return (
        <header className={classes.header}>
            <div className={classes.logo}>
                <span className={classes.specialR}>R</span>efit <span className={classes.adminText}>Admin</span>
            </div>
            <nav className={classes.nav}>
                <NavLink to="/admin" className={getNavLinkClass} end>Dashboard</NavLink>
                <NavLink to="/admin/reports" className={getNavLinkClass}>Reports</NavLink>
                <NavLink to="/admin/members" className={getNavLinkClass}>Members</NavLink>
                <NavLink to="/admin/classes" className={getNavLinkClass}>Classes</NavLink>
                <button onClick={handleLogout} className={classes.logoutButton}>
                    Logout
                </button>
            </nav>
        </header>
    );
}
