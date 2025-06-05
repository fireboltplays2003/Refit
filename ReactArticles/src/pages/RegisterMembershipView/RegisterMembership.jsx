import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import MemberHeader from "../MemberView/MemberHeader";
import styles from "./RegisterMembership.module.css"; // Create or replace with your styles

export default function RegisterMembership({ currentUser }) {
  const plans = [
    { id: 1, name: "Basic", price: 120, benefits: ["Gym access", "Book classes", "Track membership"], months: [3, 12] },
    { id: 2, name: "Standard", price: 160, benefits: ["All Basic features", "2 free classes/month"], months: [3, 12] },
    { id: 3, name: "Premium", price: 200, benefits: ["All Standard features", "4 free classes/month"], months: [3, 12] }
  ];

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [duration, setDuration] = useState(null);
  const [finalPrice, setFinalPrice] = useState(0);
  const [paypalReady, setPaypalReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const paypalScriptLoaded = useRef(false);

  useEffect(() => {
    if (paypalScriptLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=AYHk_RKasr6nntaQY1qj9Gr4ftu1xpACfC11Bb1OPboYvJ8kaw_hZrE5V2V9-sZtzdnJaNM_ctUggH1V&currency=USD";
    script.addEventListener("load", () => setPaypalReady(true));
    document.body.appendChild(script);
    paypalScriptLoaded.current = true;
  }, []);

  useEffect(() => {
    const container = document.getElementById("paypal-membership-button");
    if (!paypalReady || !selectedPlan || !duration || !window.paypal || !container) return;

    container.innerHTML = "";

    window.paypal.Buttons({
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
            userId: currentUser.UserID,
            membershipTypeId: selectedPlan.id,
            months: duration
          });

          await axios.post("http://localhost:8801/update-role", {
            userId: currentUser.UserID,
            newRole: "member"
          });

          setMessage("Membership registered and role updated!");
          setError("");
        } catch (err) {
          console.error(err);
          setError("Something went wrong after payment.");
        }
      },
      onError: () => setError("Payment failed.")
    }).render("#paypal-membership-button");
  }, [paypalReady, selectedPlan, duration, finalPrice]);

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
  };

  return (
    <>
      <MemberHeader />
      <div className={styles.container}>
        <h1>Choose a Membership Plan</h1>

        <div className={styles.cards}>
          {plans.map(plan => (
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
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div className={styles.duration}>
            <h3>Select Duration</h3>
            <button onClick={() => handleDurationSelect(3)}>3 Months</button>
            <button onClick={() => handleDurationSelect(12)}>1 Year</button>
          </div>
        )}

        {duration && (
          <>
            <p><strong>Total: {finalPrice} ₪</strong></p>
            <div id="paypal-membership-button" style={{ marginTop: "20px" }}></div>
          </>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}
      </div>
    </>
  );
}