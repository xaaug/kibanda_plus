

import TelegramBot from 'node-telegram-bot-api';
import { BOT_TOKEN } from '../config/env.js';

console.log('BOT_TOKEN', BOT_TOKEN)
console.log('BOT_TOKEN', process.env.BOT_TOKEN)

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

export default bot;
