import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import AdminHeader from "./AdminHeader";
import Footer from "../../components/Footer";
export default function AdminView() {
    const navigate = useNavigate();
    const [showContent, setShowContent] = useState(false);
    const [name, setName] = useState("");
    axios.get("/whoami", { withCredentials: true })
        .then(res => {
            setName(res.data.FirstName + " " + res.data.LastName);
            if (res.data.Role !== 'admin') {
                navigate("/" + res.data.Role);
            } else {
                setShowContent(true);
            }
        })
        .catch(() => {
            navigate("/login");
        });

    if (!showContent) return null;
    return (
        <>
        <AdminHeader />
        <div>
            <h1>Admin View</h1>
            <div>Welcome, {name}!</div>
        </div>
        <Footer />
        </>
    );
}