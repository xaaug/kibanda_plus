// subscriptions.js
import fs from 'fs';

const subsFile = './data/subscriptions.json';
export const subscriptions = {};

// Load subscriptions from file
export const loadSubscriptions = () => {
  try {
    const data = JSON.parse(fs.readFileSync(subsFile, 'utf-8'));
    for (const key in data) {
      subscriptions[key] = data[key];
    }
  } catch {
    // If file doesn't exist or is invalid, start fresh
    console.log('🗃️ No subscriptions file found. Starting with empty list.');
  }
};

// Save current subscriptions to file
export const saveSubscriptions = () => {
  fs.writeFileSync(subsFile, JSON.stringify(subscriptions, null, 2));
};

// Check if user is subscribed
export const isSubscribed = (chatId) => {
  return !!subscriptions[chatId];
};

// Add a user to subscriptions
export const addSubscription = (chatId) => {
  subscriptions[chatId] = true;
  saveSubscriptions();
};

// Remove a user from subscriptions
export const removeSubscription = (chatId) => {
  delete subscriptions[chatId];
  saveSubscriptions();
};
