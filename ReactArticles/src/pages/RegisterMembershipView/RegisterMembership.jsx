import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import UserHeader from "../UserView/UserHeader";
import styles from "./RegisterMembership.module.css";
import ProfileModal from "../../components/ProfileModal";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";

export default function RegisterMembership({ user, setUser }) {
  const plans = [
    { id: 1, name: "Basic", price: 120, benefits: ["Gym access", "Book classes", "Track membership"] },
    { id: 2, name: "Standard", price: 160, benefits: ["All Basic features", "2 free classes/month"] },
    { id: 3, name: "Premium", price: 200, benefits: ["All Standard features", "4 free classes/month"] }
  ];

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [duration, setDuration] = useState(null);
  const [finalPrice, setFinalPrice] = useState(0);
  const [paypalReady, setPaypalReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [justRegisteredAndLoggedOut, setJustRegisteredAndLoggedOut] = useState(false);

  const navigate = useNavigate();
  const paypalScriptLoaded = useRef(false);
  const paypalBtnsInstance = useRef(null);

  useEffect(() => {
    if (justRegisteredAndLoggedOut) return;
    if (user && user.Role === "user") {
      setAuthorized(true);
    } else if (user && user.Role && user.Role !== "user") {
      navigate("/" + user.Role);
    }
  }, [user, navigate, justRegisteredAndLoggedOut]);

  useEffect(() => {
    if (paypalScriptLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=AYHk_RKasr6nntaQY1qj9Gr4ftu1xpACfC11Bb1OPboYvJ8kaw_hZrE5V2V9-sZtzdnJaNM_ctUggH1V&currency=ILS";
    script.onload = () => setPaypalReady(true);
    document.body.appendChild(script);
    paypalScriptLoaded.current = true;
  }, []);

  useEffect(() => {
    if (!paypalReady || !selectedPlan || !duration || !window.paypal) {
      if (paypalBtnsInstance.current) {
        try { paypalBtnsInstance.current.close(); } catch { }
        paypalBtnsInstance.current = null;
      }
      document.getElementById("paypal-membership-button")?.replaceChildren();
      return;
    }

    if (paypalBtnsInstance.current) {
      try { paypalBtnsInstance.current.close(); } catch { }
      paypalBtnsInstance.current = null;
    }
    document.getElementById("paypal-membership-button")?.replaceChildren();

    paypalBtnsInstance.current = window.paypal.Buttons({
      createOrder: async () => {
        const res = await axios.post("/api/paypal/create-order", {
          amount: finalPrice
        });
        return res.data.id;
      },
      onApprove: async (data) => {
        try {
          await axios.post("/api/paypal/capture-order", { orderID: data.orderID });

          // 1) Register membership and get dates for the receipt
          const regRes = await axios.post(
            "/user/register-membership",
            {
              userId: user.UserID,
              membershipTypeId: selectedPlan.id,
              months: duration
            },
            { withCredentials: true }
          );
          const { startDate, endDate } = regRes.data || {};

          // 2) Update role
          await axios.post(
            "/user/update-role",
            { userId: user.UserID, newRole: "member" },
            { withCredentials: true }
          );

          // 3) Send purchase receipt (NEW)
          try {
            await axios.post(
              "/user/send-receipt",
              {
                userId: user.UserID,
                planName: selectedPlan.name,
                duration,
                total: finalPrice,
                startDate,
                endDate,
              },
              { withCredentials: true }
            );
          } catch (mailErr) {
            console.error("Receipt email failed:", mailErr);
          }

          // 4) Log out
          await axios.post("/logout", {}, { withCredentials: true });
          setUser({});
          setJustRegisteredAndLoggedOut(true);
          setMessage("Membership registered! Please log in again to access your member features.");
          setTimeout(() => {
            navigate("/login");
          }, 2200);
        } catch (err) {
          setError("Something went wrong after payment.");
          console.error("Payment error:", err);
        }
      },
      onError: () => setError("Payment failed.")
    });

    paypalBtnsInstance.current.render("#paypal-membership-button");
    return () => {
      if (paypalBtnsInstance.current) {
        try { paypalBtnsInstance.current.close(); } catch { }
        paypalBtnsInstance.current = null;
      }
      document.getElementById("paypal-membership-button")?.replaceChildren();
    };
  }, [paypalReady, selectedPlan, duration, finalPrice, user, navigate, setUser]);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setDuration(null);
    setFinalPrice(0);
    setMessage("");
    setError("");
  };

  const handleDurationSelect = (months) => {
    setDuration(months);
    setFinalPrice(months * selectedPlan.price);
    setMessage("");
    setError("");
  };

  if (!authorized && !justRegisteredAndLoggedOut) return null;

  return (
    <>
      <UserHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />
      <div className={styles.bg}>
        <div className={styles.container}>
          <h1>Choose a Membership Plan</h1>
          <div className={styles.topRow}>
            {[plans[0], plans[1]].map(plan => (
              <div
                key={plan.id}
                className={`${styles.card} ${selectedPlan?.id === plan.id ? styles.selected : ""}`}
                onClick={() => handlePlanSelect(plan)}
              >
                <h2>{plan.name}</h2>
                <p><strong>{plan.price} ₪/month</strong></p>
                <ul>
                  {plan.benefits.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
                {selectedPlan?.id === plan.id && <span className={styles.selectedLabel}>Selected</span>}
              </div>
            ))}
          </div>
          <div className={styles.bottomRow}>
            <div
              className={`${styles.card} ${selectedPlan?.id === plans[2].id ? styles.selected : ""}`}
              onClick={() => handlePlanSelect(plans[2])}
            >
              <h2>{plans[2].name}</h2>
              <p><strong>{plans[2].price} ₪/month</strong></p>
              <ul>
                {plans[2].benefits.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
              {selectedPlan?.id === plans[2].id && <span className={styles.selectedLabel}>Selected</span>}
            </div>
          </div>
          {selectedPlan && (
            <div className={styles.duration}>
              <h3>Select Duration</h3>
              <div className={styles.buttonsContainer}>
                <button
                  onClick={() => handleDurationSelect(3)}
                  className={duration === 3 ? styles.selectedDuration : ""}
                >3 Months</button>
                <button
                  onClick={() => handleDurationSelect(12)}
                  className={duration === 12 ? styles.selectedDuration : ""}
                >1 Year</button>
              </div>
            </div>
          )}
          <div id="paypal-membership-button" style={{
            marginTop: duration ? "2rem" : "0",
            minHeight: "55px",
            display: duration ? "block" : "none"
          }}></div>
          {duration && (
            <p className={styles.total}><strong>Total: {finalPrice} ₪</strong></p>
          )}
          {error && <p className={styles.errorMsg}>{error}</p>}
          {message && <p className={styles.successMsg}>{message}</p>}
        </div>
        <Footer />
        <ProfileModal
          show={showProfile}
          onClose={() => setShowProfile(false)}
          userData={user}
          onUpdate={setUser}
        />
      </div>
    </>
  );
}
