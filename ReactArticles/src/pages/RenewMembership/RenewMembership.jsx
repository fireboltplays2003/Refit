import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import MemberHeader from "../MemberView/MemberHeader";
import styles from "./RenewMembership.module.css";
import ProfileModal from "../../components/ProfileModal";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";

// Your plans config
const plans = [
  { id: 1, name: "Basic", price: 120, benefits: ["Gym access", "Book classes", "Track membership"], classAmount: 2 },
  { id: 2, name: "Standard", price: 160, benefits: ["All Basic features", "2 free classes/month"], classAmount: 2 },
  { id: 3, name: "Premium", price: 200, benefits: ["All Standard features", "4 free classes/month"], classAmount: 4 }
];

export default function RenewMembership({ user, setUser }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [duration, setDuration] = useState(null);
  const [finalPrice, setFinalPrice] = useState(0);
  const [paypalReady, setPaypalReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const paypalScriptLoaded = useRef(false);
  const paypalBtnsInstance = useRef(null);

  // Fetch membership on load
  useEffect(() => {
    if (!user || !user.Role) return;
    if (user.Role !== "member") {
      navigate("/" + user.Role);
    } else {
      setAuthorized(true);
      axios.get("/member/my-membership", { withCredentials: true })
        .then(res => {
          setCurrentMembership(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user, navigate]);

  // Load PayPal script ONCE
  useEffect(() => {
    if (paypalScriptLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=AYHk_RKasr6nntaQY1qj9Gr4ftu1xpACfC11Bb1OPboYvJ8kaw_hZrE5V2V9-sZtzdnJaNM_ctUggH1V&currency=ILS";
    script.onload = () => setPaypalReady(true);
    document.body.appendChild(script);
    paypalScriptLoaded.current = true;
  }, []);

  // Handle PayPal Button logic
  useEffect(() => {
    if (!paypalReady || !selectedPlan || !duration || !window.paypal) {
      if (paypalBtnsInstance.current) {
        try { paypalBtnsInstance.current.close(); } catch {}
        paypalBtnsInstance.current = null;
      }
      document.getElementById("paypal-renew-button")?.replaceChildren();
      return;
    }
    if (paypalBtnsInstance.current) {
      try { paypalBtnsInstance.current.close(); } catch {}
      paypalBtnsInstance.current = null;
    }
    document.getElementById("paypal-renew-button")?.replaceChildren();

    paypalBtnsInstance.current = window.paypal.Buttons({
      createOrder: async () => {
        const res = await axios.post("/api/paypal/create-order", { amount: finalPrice });
        return res.data.id;
      },
      onApprove: async (data) => {
        try {
          await axios.post("/api/paypal/capture-order", { orderID: data.orderID });

          const payload = {
            membershipTypeId: selectedPlan?.id,
            months: duration,
            oldMembershipId: currentMembership?.MemberShipID,
          };
          if (!payload.membershipTypeId || !payload.months || !payload.oldMembershipId) {
            alert("Frontend error: missing data: " + JSON.stringify(payload));
            setError("Something wrong on the frontend - please reselect your plan and duration.");
            return;
          }

          const renewRes = await axios.post(
            "/member/renew-membership",
            {
              membershipTypeId: selectedPlan.id,
              months: duration,
              oldMembershipId: currentMembership.MemberShipID
            },
            { withCredentials: true }
          );

          if (renewRes.data && renewRes.data.updatedUser) {
            setUser(renewRes.data.updatedUser);
          }

          setMessage(`Membership renewed! Your plan and credits were updated. Total paid: ${renewRes.data.totalPaid} ₪`);
          setError("");
          setCurrentMembership(renewRes.data.updatedMembership);

          setTimeout(() => {
            navigate("/membership");
          }, 3000);
        } catch (err) {
          console.error("Renew error:", err);
          setError(
            err?.response?.data?.error ||
            err?.message ||
            "Something went wrong after payment."
          );
        }
      },
      onError: () => setError("Payment failed.")
    });

    paypalBtnsInstance.current.render("#paypal-renew-button");
    return () => {
      if (paypalBtnsInstance.current) {
        try { paypalBtnsInstance.current.close(); } catch {}
        paypalBtnsInstance.current = null;
      }
      document.getElementById("paypal-renew-button")?.replaceChildren();
    };
  }, [paypalReady, selectedPlan, duration, finalPrice, user, currentMembership, setUser, navigate]);

  // Plan & duration logic
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

  if (!authorized || loading) return <div className={styles.bg}><div className={styles.container}>Loading...</div></div>;

  return (
    <>
      <MemberHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />
      <div className={styles.bg}>
        <div className={styles.container}>
          <h1>Renew Your Membership</h1>
          {currentMembership && (
            <div className={styles.currentPlanBox}>
              <div className={styles.currentPlanTitle}>
                Current Plan:
                <span className={styles.currentPlanName}>
                  {currentMembership.PlanName}
                </span>
              </div>
              <div className={styles.currentPlanUnderline} />
              <div className={styles.membershipInfoRow}>
                <span>
                  <b>Ends:</b>{" "}
                  {currentMembership.EndDate
                    ? new Date(currentMembership.EndDate).toLocaleDateString("en-GB")
                    : "N/A"}
                </span>
                <span>
                  <b>Classes Left:</b> {currentMembership.ClassAmount ?? "N/A"}
                </span>
              </div>
            </div>
          )}
          {/* Top row: Basic + Standard */}
          <div className={styles.topRow}>
            {[plans[0], plans[1]].map((plan) => (
              <div
                key={plan.id}
                className={`${styles.card} ${selectedPlan?.id === plan.id ? styles.selected : ""}`}
                onClick={() => handlePlanSelect(plan)}
              >
                <h2>{plan.name}</h2>
                <p>
                  <strong>{plan.price} ₪/month</strong>
                </p>
                <ul>
                  {plan.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                {selectedPlan?.id === plan.id && (
                  <span className={styles.selectedLabel}>Selected</span>
                )}
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
              <p>
                <strong>{plans[2].price} ₪/month</strong>
              </p>
              <ul>
                {plans[2].benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              {selectedPlan?.id === plans[2].id && (
                <span className={styles.selectedLabel}>Selected</span>
              )}
            </div>
          </div>
          {/* Duration */}
          {selectedPlan && (
            <div className={styles.duration}>
              <h3>Select Duration</h3>
              <div className={styles.buttonsContainer}>
                <button
                  onClick={() => handleDurationSelect(3)}
                  className={duration === 3 ? styles.selectedDuration : ""}
                >
                  3 Months
                </button>
                <button
                  onClick={() => handleDurationSelect(12)}
                  className={duration === 12 ? styles.selectedDuration : ""}
                >
                  1 Year
                </button>
              </div>
            </div>
          )}
          {/* PayPal button */}
          <div
            id="paypal-renew-button"
            style={{
              marginTop: duration ? "2rem" : "0",
              minHeight: "55px",
              display: duration ? "block" : "none",
            }}
          ></div>
          {duration && (
            <p className={styles.total}>
              <strong>Total: {finalPrice} ₪</strong>
            </p>
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
