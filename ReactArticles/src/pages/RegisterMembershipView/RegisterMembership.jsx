import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import UserHeader from "../UserView/UserHeader";
import styles from "./RegisterMembership.module.css";
import ProfileModal from "../../components/ProfileModal";

export default function RegisterMembership({ currentUser }) {
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
  const [user, setUser] = useState({});

  const paypalScriptLoaded = useRef(false);
  const paypalBtnsInstance = useRef(null);

  // Fetch user for modal
  useEffect(() => {
    axios.get("/whoami", { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser({}));
  }, []);

  // Load PayPal script ONCE
  useEffect(() => {
    if (paypalScriptLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=AYHk_RKasr6nntaQY1qj9Gr4ftu1xpACfC11Bb1OPboYvJ8kaw_hZrE5V2V9-sZtzdnJaNM_ctUggH1V&currency=ILS";
    script.onload = () => setPaypalReady(true);
    document.body.appendChild(script);
    paypalScriptLoaded.current = true;
  }, []);

  // Handle PayPal Button: Never remove the container. Only re-render buttons inside.
  useEffect(() => {
    if (!paypalReady || !selectedPlan || !duration || !window.paypal) {
      // Cleanup button if user changes plan/duration away (unselects)
      if (paypalBtnsInstance.current) {
        try { paypalBtnsInstance.current.close(); } catch { /* Ignore */ }
        paypalBtnsInstance.current = null;
      }
      document.getElementById("paypal-membership-button")?.replaceChildren();
      return;
    }

    // Always cleanup before re-rendering
    if (paypalBtnsInstance.current) {
      try { paypalBtnsInstance.current.close(); } catch { /* Ignore */ }
      paypalBtnsInstance.current = null;
    }
    document.getElementById("paypal-membership-button")?.replaceChildren();

    paypalBtnsInstance.current = window.paypal.Buttons({
      createOrder: async () => {
        const res = await axios.post("http://localhost:8801/api/paypal/create-order", {
          amount: finalPrice
        });
        return res.data.id;
      },
      onApprove: async (data) => {
        try {
          await axios.post("http://localhost:8801/api/paypal/capture-order", { orderID: data.orderID });
          await axios.post("http://localhost:8801/register-membership", {
            userId: currentUser?.UserID,
            membershipTypeId: selectedPlan.id,
            months: duration
          });
          await axios.post("http://localhost:8801/update-role", {
            userId: currentUser?.UserID,
            newRole: "member"
          });
          setMessage("Membership registered and role updated!");
          setError("");
        } catch {
          setError("Something went wrong after payment.");
        }
      },
      onError: () => setError("Payment failed.")
    });

    paypalBtnsInstance.current.render("#paypal-membership-button");
    // Cleanup on unmount/change
    return () => {
      if (paypalBtnsInstance.current) {
        try { paypalBtnsInstance.current.close(); } catch { }
        paypalBtnsInstance.current = null;
      }
      document.getElementById("paypal-membership-button")?.replaceChildren();
    };
  }, [paypalReady, selectedPlan, duration, finalPrice, currentUser]);

  // Plan and duration handlers
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

  return (
    <>
      <UserHeader name={user.FirstName + " " + user.LastName} onProfile={() => setShowProfile(true)} />
      <div className={styles.bg}>
        <div className={styles.container}>
          <h1>Choose a Membership Plan</h1>
          {/* Top row: Basic + Standard */}
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
          {/* Premium below */}
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
          {/* Duration */}
          {selectedPlan && (
            <div className={styles.duration}>
              <h3>Select Duration</h3>
              <button
                onClick={() => handleDurationSelect(3)}
                className={duration === 3 ? styles.selectedDuration : ""}
              >3 Months</button>
              <button
                onClick={() => handleDurationSelect(12)}
                className={duration === 12 ? styles.selectedDuration : ""}
              >1 Year</button>
            </div>
          )}
          {/* The PayPal button container is ALWAYS present */}
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
        {/* Profile Modal (always rendered but shown/hidden with showProfile) */}
        <ProfileModal
          show={showProfile}
          onClose={() => setShowProfile(false)}
          userData={user}
          onUpdate={u => setUser(v => ({ ...v, ...u }))}
        />
      </div>
    </>
  );
}
