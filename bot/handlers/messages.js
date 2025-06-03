import bot from "../botInstance.js";
import { userStates, newMovieStates, searchResults } from "../states.js";
import { loadMovies, getMovies } from "../movies.js";
import {
  USER_ID,
  LOGGING_GROUP_ID,
  SUBSCRIPTIONSCHANNEL_ID,
} from "../../config/env.js";
import { addPendingPayment } from "./payments.js";
import {
  saveSubscriptions,
  subscriptions,
  loadSubscriptions,
} from "./subscriptions.js";

import { processRequestInput } from "./commands.js";

const adminId = Number(USER_ID);
const loggingGroupId = Number(LOGGING_GROUP_ID);

const knownCommands = [
  "/start",
  "/help",
  "/request",
  "/search",
  "/subscribe",
  "/status",
  "/movies",
  "/reload",
  "/adminhelp",
  "/approve",
  "/test",
  "/packages",
];

export const handleMessage = async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const sender = msg.from?.username || msg.from?.first_name || "Unknown";

  console.log(`📩 Got message from ${sender} in chat ${chatId}`);

  // Safely handle text commands only if text exists and is a string
  if (text && typeof text === "string") {
    // Handle commands starting with '/'
    if (text.startsWith("/")) {
      const command = text.split(" ")[0];
      if (!knownCommands.includes(command)) {
        return bot.sendMessage(
          chatId,
          `🚫 Nice try, but "${command}" ain't a command I know. Try /help for the real deal.`,
        );
      }
      return;
    }

    // Admin commands available
    if (chatId === adminId) {
      if (text === "/reload") {
        loadMovies(); // Make sure you have this function defined somewhere
        return bot.sendMessage(
          chatId,
          "🔄 Reloaded movies database successfully.",
        );
      }
      if (text === "/adminhelp") {
        return bot.sendMessage(
          chatId,
          "🔧 *Admin Commands:*\n" +
            "/reload - Reload movies database\n" +
            "/admin_help - Show this message",
          { parse_mode: "Markdown" },
        );
      }
    }

    // /movies to list movies
    if (text === "/movies") {
      // console.log("movies", movies);
      if (movies.length === 0) {
        return bot.sendMessage(chatId, "No movies loaded currently.");
      }

      // Chunk movies into groups of 10 per message to avoid long messages
      const chunkSize = 10;
      for (let i = 0; i < movies.length; i += chunkSize) {
        const chunk = movies.slice(i, i + chunkSize);
        const message = chunk
          .map(
            (m) =>
              ` *${m.title}* (${m.year}) — _${m.genre}_ |  ${m.resolution || "N/A"}`,
          )
          .join("\n");

        bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
      }
      return;
    }

    //Handle user content requests

    if (userStates[chatId] === "awaiting_request_input") {
      // console.log("Processing request input")
      processRequestInput(msg);
      return;
    }

    //Handle user subscription
    if (userStates[chatId] === "awaiting_subscription_input") {
      const input = text.trim();
      const [packageName, paymentCode] = input.split(/\s+/);

      const validPackages = ["once", "weekly", "monthly"];
      const mpesaCodeRegex = /^[A-Z0-9]{10,11}$/;

      if (!packageName || !paymentCode) {
        return bot.sendMessage(
          chatId,
          "🚫 *Invalid format.*\n\nUse: `package payment_code`\nExample: `weekly QJD4KL9K3H`",
          { parse_mode: "Markdown" },
        );
      }

      if (!validPackages.includes(packageName.toLowerCase())) {
        return bot.sendMessage(
          chatId,
          `🚫 *Invalid package.*\n\nChoose from: \`${validPackages.join("`, `")}\``,
          { parse_mode: "Markdown" },
        );
      }

      if (!mpesaCodeRegex.test(paymentCode)) {
        return bot.sendMessage(
          chatId,
          "⚠️ *Invalid M-Pesa code format.*\n\nMake sure it is 10–11 characters and contains only capital letters and numbers.",
          { parse_mode: "Markdown" },
        );
      }

      // Check for duplicate code
      const loadedSubscriptions = await loadSubscriptions();
      const isDuplicate = loadedSubscriptions.some((sub) => sub.code === paymentCode);
      if (isDuplicate) {
        return bot.sendMessage(
          chatId,
          "⚠️ This M-Pesa code has already been submitted. If this is a mistake, contact support.",
          { parse_mode: "Markdown" },
        );
      }

      const subscriptionPending = loadedSubscriptions.some((sub) => sub.status === 'pending') && loadedSubscriptions.some((sub) => sub.userId === chatId);
      if (subscriptionPending) {
        return bot.sendMessage(
          chatId,
          "⚠️ Your subscription is pending verification. You'll be notified once it's active.",
          { parse_mode: "Markdown" },
        );
      }

      const now = new Date();
      const requestedDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const requestedHour = now.toTimeString().split(" ")[0]; // HH:MM:SS

      let expiryDateTime = null;
      let expiryDate = null;
      let expiryTime = null;

      if (packageName === "weekly") {
        expiryDateTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (packageName === "monthly") {
        expiryDateTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else if (packageName === "once") {
        expiryDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }

      if (expiryDateTime) {
        expiryDate = expiryDateTime.toISOString().split("T")[0]; // 'YYYY-MM-DD'
        // console.log(expiryDate);
        expiryTime = expiryDateTime.toISOString().split("T")[1].split(".")[0]; // 'HH:mm:ss'
        // console.log(expiryTime);
      }

      const subscriptionData = {
        userId: msg.from.id,
        username: msg.from.first_name?.toLowerCase() || null,
        package: packageName.toLowerCase(),
        code: paymentCode,
        requestedDate,
        requestedHour,
        expiryDate, //  "2025-06-07"
        expiryTime, //  "14:23:00"
        status: "pending",
      };

      // Save subscription
      saveSubscriptions(subscriptionData);

      bot.sendMessage(
        chatId,
        "📥 *Request received.* Your payment is being processed.",
        { parse_mode: "Markdown" },
      );

      const approvalMsg = `
        *New Subscription Request*  
        User: @${msg.from.username || msg.from.first_name || msg.from.id}  
        ID: ${msg.from.id}  
        Package: ${packageName}  
        Code: \`${paymentCode}\`  
        Date: ${requestedDate}  
        Time: ${requestedHour}
`;

      try {
        bot.sendMessage(SUBSCRIPTIONSCHANNEL_ID, approvalMsg, {
          parse_mode: "Markdown",
        });
      } catch (err) {
        console.error("❌ Failed to send subscription approval message:", err);
        // Fallback: notify admin
        bot.sendMessage(
          adminId,
          `❌ Failed to send subscription notification to channel. Details:\n${approvalMsg}`,
          { parse_mode: "Markdown" },
        );
      }

      delete userStates[chatId];
    }

    // Handle movie search flow (user input for search query)
    if (userStates[chatId] === "awaiting_movie_name") {
      userStates[chatId] = null;
      const query = text.toLowerCase();

      const allMovies = await loadMovies();
      // console.log('Searched movies', allMovies.length)
      const matchedMovies = allMovies.filter((m) =>
        m.title.toLowerCase().includes(query),
      );
      // console.log(matchedMovies.length)

      if (matchedMovies.length === 0) {
        return bot.sendMessage(
          chatId,
          `No movies found matching "${text}". Try another name or /request it.`,
        );
      }

      const results = matchedMovies;
      searchResults[chatId] = results;

      const buttons = results.map((movie, index) => {
        const shortTitle =
          movie.title.length > 25
            ? movie.title.slice(0, 22) + "..."
            : movie.title;
        const buttonText = `🎬 ${shortTitle} (${movie.year}) | 🏷️ ${movie.genre} | 📺 ${movie.resolution}`;
        return [{ text: buttonText, callback_data: `get_${index}` }];
      });

      bot.sendMessage(
        chatId,
        `Found ${matchedMovies.length} result(s). Pick one to get started:`,
        {
          reply_markup: { inline_keyboard: buttons },
        },
      );

      return;
    }

    // Placeholder for series search
    if (userStates[chatId] === "awaiting_series_name") {
      userStates[chatId] = null;
      bot.sendMessage(chatId, `Searching for series: "${text}" ...`);
      return;
    }

    // Handle new movie upload steps (title, year, genre, resolution)
    if (newMovieStates[chatId]) {
      const state = newMovieStates[chatId];

      if (state.step === "awaiting_title") {
        state.title = text.trim();
        state.step = "awaiting_year";
        console.log(
          `🧾 Received title: ${state.title} for file_id: ${state.file_id}`,
        );
        bot.sendMessage(
          chatId,
          "Got it! Now, please send the *Year* of the movie:",
          { parse_mode: "Markdown" },
        );
        return;
      }

      if (state.step === "awaiting_year") {
        const year = text.trim();
        if (!/^\d{4}$/.test(year)) {
          bot.sendMessage(chatId, "Please enter a valid 4-digit year.");
          return;
        }
        state.year = year;
        state.step = "awaiting_genre";

        const genres = [
          "Action",
          "Comedy",
          "Drama",
          "Thriller",
          "Horror",
          "Romance",
          "Sci-Fi",
          "Fantasy",
          "Animation",
          "Documentary",
          "Mystery",
          "Crime",
        ];

        const genreButtons = genres.map((g) => [
          { text: g, callback_data: `genre_${g}` },
        ]);
        bot.sendMessage(chatId, "🎯 Now choose a *Genre* for the movie:", {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: genreButtons },
        });
        return;
      }

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
      console.log(
        `[🎬 Video detected] file_id: ${file_id} from ${sender} in chat ${chatId}`,
      );

      bot.sendMessage(
        chatId,
        `🎥 Got it. Saved file_id:\n${file_id}\n\nNow tell me:\n1. Movie Title?`,
      );
      newMovieStates[chatId] = {
        step: "awaiting_title",
        file_id,
      };
      return;
    }
  }

  // If none of the above matched, send fallback message
  // bot.sendMessage(chatId, 'You’re breaking the matrix. Try /help to get back on track.');
};
