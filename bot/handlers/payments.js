import fs from "fs";

const paymentsFile = "./data/pendingPayments.json";

let pendingPayments = [];

export const loadPendingPayments = () => {
  try {
    pendingPayments = JSON.parse(fs.readFileSync(paymentsFile));
  } catch {
    pendingPayments = [];
  }
};

export const savePendingPayments = () => {
  fs.writeFileSync(paymentsFile, JSON.stringify(pendingPayments, null, 2));
};

export const addPendingPayment = ({ chatId, username, code }) => {
  pendingPayments.push({ chatId, username, code });
  savePendingPayments();
};

export const removePendingPayment = (username) => {
  pendingPayments = pendingPayments.filter((p) => p.username !== username);
  savePendingPayments();
};

export const getChatIdByUsername = (username) => {
  const found = pendingPayments.find((p) => p.username === username);
  return found?.chatId || null;
};
