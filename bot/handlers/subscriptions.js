import fs from "fs";
import bot from "../botInstance.js";

import { getDB } from "../../data/db.js";

const subsFile = "./data/subscriptions.json";
export const subscriptions = [];

// Load subscriptions from file into memory
export const loadSubscriptions = async () => {
  try {
    const db = await getDB();
    const subscriptions = await db
      .collection("subscriptions")
      .find({})
      .toArray();
    // console.log("Loaded Subscriptions", subscriptions)
    return subscriptions; // return loaded subscriptions from DB
  } catch (err) {
    console.error("Failed to load subscriptions from DB:", err);
    return [];
  }
};

// Save all current in-memory subscriptions to file
export const writeAllSubscriptions = () => {
  fs.writeFileSync(subsFile, JSON.stringify({ subscriptions }, null, 2));
};

// Add a new subscription to file - Ensure existing subscriptions are loaded before modifying
export const saveSubscriptions = async (subscriptionData) => {
  try {
    const db = await getDB();
    const result = await db
      .collection("subscriptions")
      .insertOne(subscriptionData);
    console.log("✅ Subscription saved:", result.insertedId);
  } catch (err) {
    console.error("❌ Failed to save subscription:", err);
  }
};
// Check if user is subscribed (based on userId and status)
export const isSubscribed = async (userId) => {
  const db = await getDB();
  const now = new Date();

  const userSub = await db.collection("subscriptions").findOne({
    userId,
    status: "active",
  });

  if (!userSub) return false;

  const expiryString = `${userSub.expiryDate}T${userSub.expiryTime}`;
  const expiryDateTime = new Date(expiryString);

  if (isNaN(expiryDateTime.getTime())) {
    console.warn("⚠️ Invalid expiry datetime:", expiryString);
    return false;
  }

  const status = expiryDateTime > now;

  // console.log("status", status)

  return status;
};

// Deactivate expired subscriptions
export const deactivateExpiredSubscriptions = async () => {
  const db = await getDB();
  const now = new Date();

  const expiredSubs = await db
    .collection("subscriptions")
    .find({ status: "active" })
    .toArray();

  const idsToDelete = [];

  for (const sub of expiredSubs) {
    const expiryString = `${sub.expiryDate}T${sub.expiryTime}`;
    const expiryDateTime = new Date(expiryString);

    if (isNaN(expiryDateTime.getTime())) continue;

    if (expiryDateTime < now) {
      idsToDelete.push(sub._id);

      // Notify the user
      try {
        await bot.sendMessage(
          sub.userId,
          `⚠️ Your subscription has expired. Renew to continue access.`,
        );
      } catch (err) {
        console.warn(`Could not notify user ${sub.userId}:`, err.message);
      }
    }
  }

  // Delete expired subscriptions from DB
  if (idsToDelete.length > 0) {
    await db
      .collection("subscriptions")
      .deleteMany({ _id: { $in: idsToDelete } });

    console.log(`✅ Deleted ${idsToDelete.length} expired subscriptions.`);
  }

  if (idsToDelete.length > 0) {
    await db
      .collection("subscriptions")
      .updateMany(
        { _id: { $in: idsToDelete } },
        { $set: { status: "expired" } },
      );

    console.log(
      `⏳ ${idsToDelete.length} subscriptions expired and were deactivated.`,
    );
  } else {
    console.log("✅ No expired subscriptions to deactivate.");
  }
};
