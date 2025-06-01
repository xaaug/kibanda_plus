import { saveSubscriptions } from "../bot/handlers/subscriptions.js";
import { getDB } from "../data/db.js";

const test = async () => {
  await saveSubscriptions({
    userId: 12345,
    username: "testuser",
    package: "daily",
    code: "MPESA123ABC",
    requestedDate: new Date().toISOString(),
    expiryDate: "2025-05-02",
    expiryTime: "23:59:59",
    status: "active",
  });

  const db = await getDB();
  const saved = await db.collection("subscriptions").findOne({ userId: 12345 });
  console.log("✅ Saved sub:", saved);
};

test();
