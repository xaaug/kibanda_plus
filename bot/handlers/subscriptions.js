import fs from 'fs';

const subsFile = './data/subscriptions.json';
export const subscriptions = [];

// Load subscriptions from file into memory
export const loadSubscriptions = () => {
  try {
    const raw = fs.readFileSync(subsFile, 'utf-8');
    const data = JSON.parse(raw);
    subscriptions.length = 0; // Clear current array
    subscriptions.push(...data.subscriptions);
    return subscriptions;  // return loaded subscriptions
  } catch {
    console.log('🗃️ No subscriptions file found. Starting with empty list.');
    subscriptions.length = 0;  // ensure empty array
    return subscriptions; // return empty array
  }
};



// Save all current in-memory subscriptions to file
export const writeAllSubscriptions = () => {
  fs.writeFileSync(subsFile, JSON.stringify({ subscriptions }, null, 2));
};

// Add a new subscription to file
export const saveSubscriptions = (subscriptionData) => {
  subscriptions.push(subscriptionData);
  writeAllSubscriptions();
};

// Check if user is subscribed (based on userId and status)
export const isSubscribed = (userId) => {
  const now = new Date();
  return subscriptions.some(
    (sub) =>
      sub.userId === userId &&
      sub.status === 'active' &&
      new Date(sub.expiryDateTime) > now
  );
};

// Deactivate expired subscriptions
export const deactivateExpiredSubscriptions = () => {
  const now = new Date();
  let changed = false;

  for (const sub of subscriptions) {
    if (sub.status === 'active' && new Date(sub.expiryDateTime) < now) {
      sub.status = 'expired';
      changed = true;

      // Notify the user
      bot.sendMessage(sub.userId, `⚠️ Your subscription has expired. Renew to continue access.`);
    }
  }

  if (changed) {
    writeAllSubscriptions(); // Save only if something changed
    console.log('⏳ Some subscriptions have expired and were deactivated.');
  }
};

