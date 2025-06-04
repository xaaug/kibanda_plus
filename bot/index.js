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
import { PORT, RENDER_EXTERNAL_URL, WEBHOOK_SECRET, USE_POLLING } from "../config/env.js";

const app = express();
const port = PORT;
const WEBHOOK_SECRET_URL = WEBHOOK_SECRET || "secret";

app.use(express.json());

// Only setup webhook route if not using polling
if (!USE_POLLING) {
  // Webhook endpoint
  app.post(`/${WEBHOOK_SECRET_URL}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

// Setup webhook with Telegram
async function setWebhook() {
  if (USE_POLLING) {
    console.log("Polling mode enabled - skipping webhook setup");
    return;
  }

  const domain = RENDER_EXTERNAL_URL;
  if (!domain) {
    console.error("Missing RENDER_EXTERNAL_URL. Cannot set webhook.");
    return;
  }

  const webhookUrl = `${domain}/${WEBHOOK_SECRET_URL}`;
  await bot.setWebHook(webhookUrl);
  console.log(`[✔] Webhook set to ${webhookUrl}`);
}

app.listen(port, async () => {
  console.log(`[🚀] Server running on port ${port}`);

  await setWebhook(); // Register webhook with Telegram (if applicable)

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

  if (USE_POLLING) {
    console.log("Bot running in polling mode");
  } else {
    console.log("Bot running in webhook mode");
  }
});
