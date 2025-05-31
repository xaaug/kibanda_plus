import bot from '../index.js';
import { adminId } from '../config.js';
import { loadMovies, movies } from '../movies.js';
import { userStates } from '../states.js'; 
import { getChatIdByUsername, removePendingPayment } from './payments.js';
import { saveSubscriptions, subscriptions } from './subscriptions.js';

export const start = (msg) => {
  const chatId = msg.chat.id;
  const text = `
*Welcome to the ultimate movie and shows bot.*

We deliver fire content — fast, clean, no sketchy links. Think of us as your personal cinema, without the lines.

*Quick Commands:*
/subscribe – Unlock premium. Because good stuff isn’t free.
/status – Check if you’re VIP or just browsing.
/search – Find your next binge.
/request – Ask for something we don’t have. Hope included.

/help – If you’re lost or just like reading lists.

Type the name of a movie or show to get started. Yes, it’s that simple.

Pia tukona ngwati, so just request.
  `;

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
};

export const help = (msg) => {
  const chatId = msg.chat.id;
  const text = `
*Command Manual – For Those Who Need Instructions*

/start – You’re already here. Clap for yourself.
/subscribe – Want movies? Pay up. Unlock full access.
/status – Know your level. VIP or not.
/search – Find that fire flick.
/request – Ask for something we don’t have. Hope included.

Just type the name of the movie or show. If we have it, you’ll get it. If not... well, we’ll pretend we’re working on it.
  `;

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
};

export const search = (msg) => {
  const chatId = msg.chat.id;

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Movie', callback_data: 'search_movie' },
          { text: 'Series', callback_data: 'search_series' },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, 'What do you want to search for?', opts);
};

export const request = (msg) => {
  const chatId = msg.chat.id;
  console.log(`📩 User ${msg.from.username || msg.from.id} requested content in chat ${chatId}`);

  userStates[chatId] = 'awaiting_request_input';

  const prompt = `🎤 *What movie or show are you looking for?*\n\nType the name, and we’ll pretend to be shocked it’s not already in our catalog.`;

  bot.sendMessage(chatId, prompt, { parse_mode: 'Markdown' });
};

export const processRequestInput = (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || `ID: ${msg.from.id}`;
  const query = msg.text.trim();

  if (!query) {
    return bot.sendMessage(chatId, '🚫 You sent an empty request. Hit me with the movie name, please.');
  }

  bot.sendMessage(
    chatId,
    `*Request received.*\n\nWe’ve thrown your request into the abyss where important things go. If the stars align, you’ll see it soon. Or not. That’s life.`,
    { parse_mode: 'Markdown' }
  );

  bot.sendMessage(
    adminId,
    `*New content request:*\nUser: @${username}\nMovie: ${query}`,
    { parse_mode: 'Markdown' }
  );

  delete userStates[chatId];
};


export const reload = (msg) => {
  const chatId = msg.chat.id;

  if (msg.from.id !== adminId) {
    return bot.sendMessage(chatId, '🚫 You are not authorized to do this.');
  }

  try {
    loadMovies();
    bot.sendMessage(chatId, `✅ Reloaded ${movies.length} movies from file.`);
    console.log('✅ Movies reloaded from disk.');
  } catch (err) {
    bot.sendMessage(chatId, '❌ Failed to reload movies.');
    console.error('❌ Reload error:', err);
  }
};

export const adminHelp = (msg) => {
  const chatId = msg.chat.id;

  if (msg.from.id !== adminId) {
    return bot.sendMessage(chatId, '🚫 You are not authorized to view admin commands.');
  }

  const text = `
🔧 *Admin Commands:*

/reload - Reload movies database
/adminhelp - Show this message
/movies - List all movies currently loaded
`;

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
};

export const moviesList = (msg) => {
  const chatId = msg.chat.id;

  if (movies.length === 0) {
    return bot.sendMessage(chatId, 'No movies loaded currently.');
  }

  const chunkSize = 10;
  for (let i = 0; i < movies.length; i += chunkSize) {
    const chunk = movies.slice(i, i + chunkSize);
    const message = chunk
      .map(
        (m) =>
          `🎬 *${m.title}* (${m.year}) — _${m.genre}_ | 📺 ${m.resolution || 'N/A'}`
      )
      .join('\n');
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }
};

export const subscribe = msg => {
  const chatId = msg.chat.id;
  const instructions = `
💳 *Subscribe to Unlock Downloads*

Send KES 99 to:

*Till Number:* 123456  
*Account:* Your Telegram Username

Then reply here with your M-Pesa *transaction code*.`;

  userStates[chatId] = 'awaiting_payment_code';
  bot.sendMessage(chatId, instructions, { parse_mode: 'Markdown' });
}


//Handle user subscription check request
export const approve = (msg, match) => {
 const username = match[1];
  const chatId = getChatIdByUsername(username);

  if (!chatId) {
    return bot.sendMessage(msg.chat.id, `❌ Couldn’t find @${username} in pending payments.`);
  }

  subscriptions[chatId] = true;
  saveSubscriptions();

  removePendingPayment(username);

  bot.sendMessage(chatId, `✅ You’ve been subscribed! You can now download movies.`);
  bot.sendMessage(msg.chat.id, `👍 Approved @${username}`);
}

export const test = msg => {
  const chatId = msg.chat.id

  bot.sendMessage(chatId,'Command executed')
}
