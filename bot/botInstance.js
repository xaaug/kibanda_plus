
import TelegramBot from "node-telegram-bot-api";
import { BOT_TOKEN } from "../config/env.js";

const bot = new TelegramBot(BOT_TOKEN); // No polling!

export default bot;
