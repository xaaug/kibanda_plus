// server.js
import express from "express";
import dotenv from "dotenv";
dotenv.config();

import bot from "./botInstance.js";
import {
  loadSubscriptions,
  deactivateExpiredSubscriptions,
} from "./handlers/subscriptions.js";

import * as commands from "./handlers/commands.js";
import * as messages from "./handlers/messages.js";
import * as callbacks from "./handlers/callbacks.js";
import { PORT, RENDER_EXTERNAL_URL, WEBHOOK_SECRET } from "../config/env.js";

const app = express();
const port= PORT;
const WEBHOOK_SECRET_URL = WEBHOOK_SECRET || "secret";

// Parse incoming JSON updates
app.use(express.json());

// Webhook endpoint
app.post(`/${WEBHOOK_SECRET}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Setup webhook with Telegram
async function setWebhook() {
  const domain = RENDER_EXTERNAL_URL;
  if (!domain) {
    console.error("Missing RENDER_EXTERNAL_URL. Cannot set webhook.");
    return;
  }

  const webhookUrl = `${domain}/${WEBHOOK_SECRET}`;
  await bot.setWebHook(webhookUrl);
  console.log(`[✔] Webhook set to ${webhookUrl}`);
}

app.listen(PORT, async () => {
  console.log(`[🚀] Server running on port ${PORT}`);

  await setWebhook(); // Register webhook with Telegram

  // Load and schedule subscription checks
  await loadSubscriptions();
  setInterval(deactivateExpiredSubscriptions, 10 * 60 * 1000); // Every 10 min

  // Register command handlers
  bot.onText(/\/start/, commands.start);
  bot.onText(/\/help/, commands.help);
  bot.onText(/\/search/, commands.search);
  bot.onText(/\/reload/, commands.reload);
  bot.onText(/\/request/, commands.request);
  bot.onText(/\/adminhelp/, commands.adminHelp);
  bot.onText(/\/movies/, commands.moviesList);
  bot.onText(/\/subscribe/, commands.subscribe);
  bot.onText(/\/packages/, commands.packages);
  bot.onText(/\/status/, commands.status);
  bot.onText(/\/latest/, commands.latest);
  bot.onText(/\/stats/, commands.stats);
  bot.onText(/\/approve @?(\w+)/, commands.approve);
  bot.onText(/\/test/, commands.test);

  bot.on("message", messages.handleMessage);
  bot.on("callback_query", callbacks.handleCallbackQuery);
});
