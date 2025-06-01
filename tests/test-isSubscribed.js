import { isSubscribed } from "../bot/handlers/subscriptions.js";

const test = async () => {
  const result = await isSubscribed(12345);
  console.log("🟢 Is subscribed:", result);
};

test();
