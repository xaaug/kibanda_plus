
import TelegramBot from "node-telegram-bot-api";
import { BOT_TOKEN, USE_POLLING } from "../config/env.js";

const usePolling = USE_POLLING === "true";

const bot = new TelegramBot(BOT_TOKEN, {polling: usePolling }); // No polling!

export default bot;
