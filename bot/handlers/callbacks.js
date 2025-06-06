import bot from "../botInstance.js";
import { userStates, searchResults, newMovieStates } from "../states.js";
import { saveMovie, loadMovies } from "../movies.js";
import { isSubscribed, loadSubscriptions } from "./subscriptions.js";
import { getDB } from "../../data/db.js";

export const handleCallbackQuery = async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;
  const userId = msg.from.id;

  if (data === "search_movie") {
    await loadSubscriptions(); // Ensure latest data from disk

    const subscribed = await isSubscribed(chatId);
    // console.log('Subscription', subscribed)

    if (!subscribed) {
      return bot.sendMessage(
        chatId,
        `🔒 This content is for *subscribed* users only.\n\nTo unlock access:\n1. Use /packages to view options\n2. Use /subscribe to submit payment\n3. Wait for approval\n\nNeed help? Message Support`,
        { parse_mode: "Markdown" },
      );
    }

    userStates[chatId] = "awaiting_movie_name";
    bot.sendMessage(chatId, "🔥 Type the name of the movie you want to find:");
  } else if (data === "search_series") {
    // userStates[chatId] = 'awaiting_series_name';
    bot.sendMessage(chatId, "Feature coming soon");
  } else if (data.startsWith("get_")) {
    const index = Number(data.split("_")[1]);
    const results = searchResults[chatId];

    if (!results || !results[index]) {
      return bot.sendMessage(chatId, `🚫 That result is no longer available.`);
    }

    const movie = results[index];
    bot.sendMessage(chatId, `🎬 Delivering: *${movie.title}*`, {
      parse_mode: "Markdown",
    });

    const db = await getDB();

    // Find movie
    const searchedMovie = await db
      .collection("movies")
      .find({
        title: movie.title,
      })
      .toArray();


    // Update status to active
    await db.collection("movies").updateMany(
      { title: movie.title },
      {
        $inc: { popularity: 1 },
      },
    );

    bot.sendVideo(chatId, movie.file_id);

    delete searchResults[chatId]; // optional: clean up memory
  }

  // Handle package selection
  if (!data.startsWith("subscribe_")) return;
  const status = await isSubscribed(chatId);
  console.log(status);

  if (status) {
    return bot.sendMessage(
      chatId,
      "⚠️ You already have an active subscription. No need to pay again.",
    );
  }

  const selectedPackage = data.split("_")[1];

  const instructions = `
*Great! You selected the* _${selectedPackage}_ *package.*

1. Go to M-Pesa → *Send Money*
   • Number: *Number*
   • Amount: *based on your package*

2. After payment, send your M-Pesa confirmation using this format:
\`${selectedPackage} QJD4KL9K3H\`

We'll verify and activate your subscription shortly. ✅`;

  bot.sendMessage(chatId, instructions, {
    parse_mode: "Markdown",
  });

  userStates[chatId] = "awaiting_subscription_input";

  // // === Handle genre selection ===
  // else if (data.startsWith("genre_")) {
  //   const genre = data.replace("genre_", "");
  //   const state = newMovieStates[chatId];
  //
  //   if (!state || state.step !== "awaiting_genre") {
  //     return bot.sendMessage(chatId, "❗ No movie is currently being added.");
  //   }
  //
  //   state.genre = genre;
  //   state.step = "awaiting_resolution";
  //
  //   // Ask for resolution selection
  //   const resolutions = ["360p", "480p", "720p", "1080p"];
  //   const resolutionButtons = resolutions.map((r) => [
  //     { text: r, callback_data: `resolution_${r}` },
  //   ]);
  //
  //   bot.sendMessage(chatId, "🎯 Now choose a *Resolution* for the movie:", {
  //     parse_mode: "Markdown",
  //     reply_markup: { inline_keyboard: resolutionButtons },
  //   });
  //
  //   return;
  // }
  //
  // // === Handle resolution selection ===
  // else if (data.startsWith("resolution_")) {
  //   const resolution = data.replace("resolution_", "");
  //   const state = newMovieStates[chatId];
  //
  //   if (!state || state.step !== "awaiting_resolution") {
  //     return bot.sendMessage(
  //       chatId,
  //       "❗ No movie is currently being added or resolution is not expected now.",
  //     );
  //   }
  //
  //   state.resolution = resolution;
  //
  //   const movie = {
  //     title: state.title,
  //     year: state.year,
  //     genre: state.genre,
  //     resolution: state.resolution,
  //     file_id: state.file_id,
  //   };
  //
  //   const saved = saveMovie(movie);
  //
  //   if (saved) {
  //     bot.sendMessage(
  //       chatId,
  //       `✅ Movie saved:\n*${movie.title}* (${movie.year}) — _${movie.genre}_ — Resolution: *${movie.resolution}*`,
  //       {
  //         parse_mode: "Markdown",
  //       },
  //     );
  //     console.log(
  //       `[✅ Movie saved] ${movie.title} (${movie.year}) genre: ${movie.genre} resolution: ${movie.resolution}`,
  //     );
  //     loadMovies().then((loadedMovies) => {
  //       console.log("Movies loaded:", loadedMovies.length);
  //     });
  //   } else {
  //     bot.sendMessage(chatId, `⚠️ This movie already exists in the list.`);
  //     console.log(`[⚠️ Duplicate movie] ${movie.title} (${movie.year})`);
  //   }
  //
  //   delete newMovieStates[chatId];
  //   return;
  // }

  // Unknown callback data fallback
  // bot.answerCallbackQuery(callbackQuery.id, { text: '⚠️ I don’t know what that means. Try again.' }).catch(console.error);

  bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
  return;
};
