import dotenv from 'dotenv';
dotenv.config();

import bot from './botInstance.js';
import { loadSubscriptions, deactivateExpiredSubscriptions } from './handlers/subscriptions.js';

import * as commands from './handlers/commands.js';
import * as messages from './handlers/messages.js';
import * as callbacks from './handlers/callbacks.js';


setInterval(async () => {
  await loadSubscriptions();
  await deactivateExpiredSubscriptions();
}, 60 * 60 * 1000); // every 1 hour 60 * 60 * 1000




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
bot.onText(/\/approve @?(\w+)/, commands.approve)
bot.onText(/\/test/, commands.test);

// Register other handlers
bot.on('message', messages.handleMessage);
bot.on('callback_query', callbacks.handleCallbackQuery);

bot.on('polling_error', (err) => {
  console.error('[Polling Error]', err);
});

