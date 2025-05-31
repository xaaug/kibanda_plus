import bot from '../index.js';
import { userStates, newMovieStates, searchResults } from '../states.js';
import { movies, saveMovie } from '../movies.js';
import { USER_ID, LOGGING_GROUP_ID } from '../../config/env.js';
import { addPendingPayment } from './payments.js';

const adminId = Number(USER_ID);
const loggingGroupId = Number(LOGGING_GROUP_ID);

const knownCommands = ['/start', '/help', '/request', '/search', '/subscribe', '/status', '/movies', '/reload', '/adminhelp', '/approve', '/test'];

export const handleMessage = (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const sender = msg.from?.username || msg.from?.first_name || 'Unknown';

  console.log(`📩 Got message from ${sender} in chat ${chatId}`);

  // Safely handle text commands only if text exists and is a string
  if (text && typeof text === 'string') {
    // Handle commands starting with '/'
    if (text.startsWith('/')) {
      const command = text.split(' ')[0];
      if (!knownCommands.includes(command)) {
        return bot.sendMessage(chatId, `🚫 Nice try, but "${command}" ain't a command I know. Try /help for the real deal.`);
      }
      // Known commands are handled elsewhere, so just return here
      return;
    }

    // Admin commands available only to admin user
    if (chatId === adminId) {
      if (text === '/reload') {
        loadMovies(); // Make sure you have this function defined somewhere
        return bot.sendMessage(chatId, '🔄 Reloaded movies database successfully.');
      }
      if (text === '/adminhelp') {
        return bot.sendMessage(chatId,
          '🔧 *Admin Commands:*\n' +
          '/reload - Reload movies database\n' +
          '/admin_help - Show this message',
          { parse_mode: 'Markdown' }
        );
      }
    }

    // Public command: /movies to list movies
    if (text === '/movies') {
      if (movies.length === 0) {
        return bot.sendMessage(chatId, 'No movies loaded currently.');
      }

      // Chunk movies into groups of 10 per message to avoid long messages
      const chunkSize = 10;
      for (let i = 0; i < movies.length; i += chunkSize) {
        const chunk = movies.slice(i, i + chunkSize);
        const message = chunk.map(m =>
          `🎬 *${m.title}* (${m.year}) — _${m.genre}_ | 📺 ${m.resolution || 'N/A'}`
        ).join('\n');

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
      return;
    }



    //Handle user content requests
    if (userStates[chatId] === 'awaiting_request_input') {
      processRequestInput(msg);
      return
    }

    //Handle user subscription
    if (userStates[chatId] === 'awaiting_payment_code') {
      const code = msg.text.trim();
      const username = msg.from.username || `ID_${msg.from.id}`;

      addPendingPayment({ chatId, username, code });

      bot.sendMessage(chatId, `💬 Thanks! We’re verifying your code. You’ll get access shortly.`);
      console.log(`🧾 New payment code received from ${username} (${chatId}): ${code}`);
      bot.sendMessage(adminId, 'hello', {
        parse_mode: 'Markdown',
      });

      delete userStates[chatId];
      return;
    }


    // Handle movie search flow (user input for search query)
    if (userStates[chatId] === 'awaiting_movie_name') {
      userStates[chatId] = null;
      const query = text.toLowerCase();
      const matchedMovies = movies.filter(m => m.title.toLowerCase().includes(query));

      if (matchedMovies.length === 0) {
        return bot.sendMessage(chatId, `No movies found matching "${text}". Try another name or /request it.`);
      }

      const results = matchedMovies.slice(0, 5);
      searchResults[chatId] = results;

      const buttons = results.map((movie, index) => {
        const shortTitle = movie.title.length > 25 ? movie.title.slice(0, 22) + '...' : movie.title;
        const buttonText = `🎬 ${shortTitle} (${movie.year}) | 🏷️ ${movie.genre} | 📺 ${movie.resolution}`;
        return [{ text: buttonText, callback_data: `get_${index}` }];
      });

      bot.sendMessage(chatId, `Found ${matchedMovies.length} result(s). Pick one to get started:`, {
        reply_markup: { inline_keyboard: buttons }
      });

      return;
    }

    // Placeholder for series search (you can expand this later)
    if (userStates[chatId] === 'awaiting_series_name') {
      userStates[chatId] = null;
      bot.sendMessage(chatId, `Searching for series: "${text}" ...`);
      return;
    }

    // Handle new movie upload steps (title, year, genre, resolution)
    if (newMovieStates[chatId]) {
      const state = newMovieStates[chatId];

      if (state.step === 'awaiting_title') {
        state.title = text.trim();
        state.step = 'awaiting_year';
        console.log(`🧾 Received title: ${state.title} for file_id: ${state.file_id}`);
        bot.sendMessage(chatId, 'Got it! Now, please send the *Year* of the movie:', { parse_mode: 'Markdown' });
        return;
      }

      if (state.step === 'awaiting_year') {
        const year = text.trim();
        if (!/^\d{4}$/.test(year)) {
          bot.sendMessage(chatId, 'Please enter a valid 4-digit year.');
          return;
        }
        state.year = year;
        state.step = 'awaiting_genre';

        const genres = [
          'Action', 'Comedy', 'Drama', 'Thriller',
          'Horror', 'Romance', 'Sci-Fi', 'Fantasy',
          'Animation', 'Documentary', 'Mystery', 'Crime'
        ];

        const genreButtons = genres.map(g => [{ text: g, callback_data: `genre_${g}` }]);
        bot.sendMessage(chatId, '🎯 Now choose a *Genre* for the movie:', {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: genreButtons }
        });
        return;
      }

      // Further steps like genre and resolution are usually handled in callback_query handlers
      return;
    }

  } // End of text-based handlers

  // Handle video messages (no text required)
  if (msg.video) {
    const isForwarded = !!msg.forward_from_chat || !!msg.forward_from;
    const file_id = msg.video.file_id;
    const isInLoggingGroup = chatId === loggingGroupId;
    const isFromAdmin = msg.from?.id === adminId;

    // Accept videos only if forwarded in logging group or sent by admin
    if ((isInLoggingGroup && isForwarded) || isFromAdmin) {
      console.log(`[🎬 Video detected] file_id: ${file_id} from ${sender} in chat ${chatId}`);

      bot.sendMessage(chatId, `🎥 Got it. Saved file_id:\n${file_id}\n\nNow tell me:\n1. Movie Title?`);
      newMovieStates[chatId] = {
        step: 'awaiting_title',
        file_id,
      };
      return;
    }
  }

  // If none of the above matched, send fallback message
  // bot.sendMessage(chatId, 'You’re breaking the matrix. Try /help to get back on track.');
};
