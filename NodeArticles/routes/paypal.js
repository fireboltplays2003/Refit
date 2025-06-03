const express = require("express");
const router = express.Router();
require("dotenv").config();

const axios = require("axios");
const BASE = "https://api-m.sandbox.paypal.com";

// Get PayPal Access Token
async function getAccessToken() {
  const res = await axios({
    url: `${BASE}/v1/oauth2/token`,
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_SECRET,
    },
    data: "grant_type=client_credentials",
  });

  return res.data.access_token;
}

// Create Order
router.post("/create-order", async (req, res) => {
  try {
    const token = await getAccessToken();

    const order = await axios.post(
      `${BASE}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: "10.00" },
        }],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(order.data);
  } catch (err) {
    console.error("Create Order Error:", err.message);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Capture Payment
router.post("/capture-order", async (req, res) => {
  const { orderID } = req.body;

  try {
    const token = await getAccessToken();

    const capture = await axios.post(
      `${BASE}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(capture.data);
  } catch (err) {
    console.error("Capture Order Error:", err.message);
    res.status(500).json({ error: "Failed to capture order" });
  }
});

module.exports = router;
