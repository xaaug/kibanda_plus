import TelegramBot from 'node-telegram-bot-api';
import { BOT_TOKEN } from '../config/env.js';

import * as commands from './handlers/commands.js';
import * as messages from './handlers/messages.js';
import * as callbacks from './handlers/callbacks.js';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Export bot to be used in handlers
export default bot;

// Register command handlers
bot.onText(/\/start/, commands.start);
bot.onText(/\/help/, commands.help);
bot.onText(/\/search/, commands.search);
bot.onText(/\/request /, commands.request);
bot.onText(/\/reload/, commands.reload);
bot.onText(/\/adminhelp/, commands.adminHelp);
bot.onText(/\/movies/, commands.moviesList);
bot.onText(/\/subscribe/, commands.subscribe);
bot.onText(/\/approve @?(\w+)/, commands.approve)
bot.onText(/\/test/, commands.test);

// Register other handlers
bot.on('message', messages.handleMessage);
bot.on('callback_query', callbacks.handleCallbackQuery);

bot.on('polling_error', (err) => {
  console.error('[Polling Error]', err);
});

