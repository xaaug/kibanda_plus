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

// Add a new subscription to file - Ensure existing subscriptions are loaded before modifying
export const saveSubscriptions = (subscriptionData) => {
  loadSubscriptions(); // load what's in file into memory
  subscriptions.push(subscriptionData);
  writeAllSubscriptions();
};

// Check if user is subscribed (based on userId and status)
export const isSubscribed = (userId) => {
  const now = new Date();

  loadSubscriptions()

  return subscriptions.some((sub) => {
    if (sub.userId !== userId || sub.status !== 'active') return false;

    const expiryString = `${sub.expiryDate}T${sub.expiryTime}`;
    const expiryDateTime = new Date(expiryString);

    if (isNaN(expiryDateTime.getTime())) {
      console.warn('⚠️ Invalid expiry datetime:', expiryString);
      return false;
    }


    const status = expiryDateTime > now


    return status;
  });
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

