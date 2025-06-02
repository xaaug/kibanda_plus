import bot from "../botInstance.js";
import { adminId } from "../config.js";
import { loadMovies, getMovies } from "../movies.js";
import { userStates } from "../states.js";
import { getChatIdByUsername, removePendingPayment } from "./payments.js";
import {
  loadSubscriptions,
  writeAllSubscriptions,
  subscriptions,
  isSubscribed,
} from "./subscriptions.js";

import { getDB } from '../../data/db.js';
import { REQUEST_GROUP_ID } from '../../config/env.js';

let movies = [];

getMovies().then((loadedMovies) => {
  movies = loadedMovies;
});

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

  `;

  bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
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
/packages - to see the available plans from one-off passes to full-on monthly madness.

Just type the name of the movie or show. If we have it, you’ll get it. If not... well, we’ll pretend we’re working on it.
  `;

  bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
};

export const search = async (msg) => {
  const chatId = msg.chat.id;

  await loadSubscriptions(); // Ensure latest data from disk

  const subscribed = await isSubscribed(chatId);
  console.log('subscription', subscribed)

  if (!subscribed) {
    return bot.sendMessage(
      chatId,
      `🔒 This content is for *subscribed* users only.\n\nTo unlock access:\n1. Use /packages to view options\n2. Use /subscribe to submit payment\n3. Use /statut to view your subscription status\n4. Wait for approval\n\nNeed help? Message Support`,
      { parse_mode: 'Markdown' }
    );
  }


  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Movie", callback_data: "search_movie" },
          { text: "Series", callback_data: "search_series" },
        ],
      ],
    },
  };

  await loadMovies()

  bot.sendMessage(chatId, 'What do you want to search for?', opts);
};

export const request = (msg) => {
  const chatId = msg.chat.id;

  console.log("New request")
  
  bot.sendMessage(
    chatId,
    '🎬 What movie or show do you want? Drop the name below and we’ll throw it into the content universe.'
  );
  userStates[chatId] = 'awaiting_request_input';
};

export const processRequestInput = (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name || `ID: ${msg.from.id}`;
  const userId = msg.from.id
  const query = msg.text.trim();

  if (!query) {
    return bot.sendMessage(
      chatId,
      "🚫 You sent an empty request. Hit me with the movie name, please.",
    );
  }

  bot.sendMessage(
    chatId,
    `*Request received.*\n\nWe’ve thrown your request into the abyss where important things go. If the stars align, you’ll see it soon. Or not. That’s life.`,
    { parse_mode: "Markdown" },
  );

  bot.sendMessage(
    REQUEST_GROUP_ID,
    `*New content request:*\nUser: @${username}\nID: ${userId}\nMovie: ${query}`,
    { parse_mode: 'Markdown' }
  );

  delete userStates[chatId];
};

export const reload = async (msg) => {
  const chatId = msg.chat.id;

  if (msg.from.id !== adminId) {
    return bot.sendMessage(chatId, "🚫 You are not authorized to do this.");
  }

  try {
    const movies = await loadMovies();
    bot.sendMessage(chatId, `✅ Reloaded ${movies.length} movies from file.`);
    console.log("✅ Movies reloaded from disk.");
  } catch (err) {
    bot.sendMessage(chatId, "❌ Failed to reload movies.");
    console.error("❌ Reload error:", err);
  }
};

export const adminHelp = (msg) => {
  const chatId = msg.chat.id;

  if (msg.from.id !== adminId) {
    return bot.sendMessage(
      chatId,
      "🚫 You are not authorized to view admin commands.",
    );
  }

  const text = `
🔧 *Admin Commands:*

/reload - Reload movies database
/adminhelp - Show this message
/movies - List all movies currently loaded
`;

  bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
};

export const moviesList = async (msg) => {
  const chatId = msg.chat.id;

  const movies = await loadMovies();
  console.log("Movies loaded:", movies.length);
  if (movies.length === 0) {
    return bot.sendMessage(chatId, "No movies loaded currently.");
  }

  const chunkSize = 20;
  for (let i = 0; i < movies.length; i += chunkSize) {
    const chunk = movies.slice(i, i + chunkSize);
    const message = chunk
      .map(
        (m) =>
          `🎬 *${m.title}* (${m.year}) — _${m.genre}_ | 📺 ${m.resolution || "N/A"}`,
      )
      .join("\n");
    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  }
};

export const subscribe = async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  
  const status =   await isSubscribed(userId);


  if (status) {
    return bot.sendMessage(
      chatId,
      "⚠️ You already have an active subscription. No need to pay again.",
    );
  }

  const prompt = `
*Ready to get VIP access?* 

Available packages:
- *One* — One-time access for one content. - 10 
- *Weekly* — Unlimited downloads for 7 days. - 100 
- *Monthly* — Unlimited downloads for 30 days. - 250 

To subscribe, follow these steps:

1. Go to M-Pesa → Send Money
   • Number: 0728507218
   • Amount: Your Package Price

2. After payment, send your M-Pesa confirmation using this format:

\`[package] [your M-Pesa code]\`

Example:
\`weekly QJD4KL9K3H\`

We’ll verify and activate your subscription shortly. 

✅ You’ll receive a confirmation once your access is active.
`;

  bot.sendMessage(chatId, prompt, { parse_mode: "Markdown" });
  userStates[chatId] = "awaiting_subscription_input";
};


export const approve = async (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1]?.toLowerCase();

  if (!username) {
    return bot.sendMessage(
      chatId,
      "⚠️ Please provide a username.\nUsage: /approve @username",
    );
  }

  try {
    const db = await getDB();

    // Find pending subs
    const pendingSubs = await db
      .collection("subscriptions")
      .find({
        username: username,
        status: "pending",
      })
      .toArray();

    if (pendingSubs.length === 0) {
      return bot.sendMessage(
        chatId,
        `❌ No pending subscription found for @${username}`,
      );
    }

    // Update status to active
    await db
      .collection("subscriptions")
      .updateMany(
        { username: username, status: "pending" },
        { $set: { status: "active" } },
      );

    // Notify users
    for (const sub of pendingSubs) {
      await bot.sendMessage(
        sub.userId,
        `✅ Your subscription is now *active*! Valid until: ${sub.expiryDate} ${sub.expiryTime}`,
        {
          parse_mode: "Markdown",
        },
      );
    }

    bot.sendMessage(
      chatId,
      `👍 Approved ${pendingSubs.length} subscription(s) for @${username}`,
    );
  } catch (err) {
    console.error("Approve error:", err);
    bot.sendMessage(
      chatId,
      "❌ Error approving subscriptions. Try again later.",
    );
  }
};

export const packages = (msg) => {
  const chatId = msg.chat.id;
  const text = `🎉 *Welcome to the Subscription Circus!*

Here’s the *very exclusive* lineup of ways you can throw your money at us and get some content:

*One Movie - 10*  
Just wanna dip your toes? Pay 10 KES for a one-time download. It’s like buying a single slice of pizza, but for movies. *Mmm, delicious.*

*Weekly Chaos Pass - 100*  
Unlimited downloads for 7 days. Because who watches just one thing? Get your binge on without guilt (or paying every 10 minutes).

*Monthly Mayhem Pass - 250*  
All-you-can-download buffet for 30 days. Stream like a pro and flex on your friends who still pay per download.

---

*Choose your poison, pay the piper, and then hit /subscribe to send us your payment code. We’ll sort you out.*

Pro tip: Paying in anything less than full enthusiasm might result in no downloads. No refunds. No excuses.
`;
  bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
};

export const status = async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;

  const allSubscriptions = await loadSubscriptions(); // Ensure we load the latest from disk

  const userSubs = allSubscriptions.filter((sub) => sub.userId === chatId);

  if (userSubs.length === 0) {
    return bot.sendMessage(
      chatId,
      " You have no subscription records yet.\nUse /subscribe to get started.",
    );
  }

  const latestSub = userSubs[userSubs.length - 1]; // Assume the most recent entry is last
  const { status, package: pkg, expiryDate, code } = latestSub;

  if (status === "pending") {
    return bot.sendMessage(
      chatId,
      `🕓 Your subscription is still *pending approval*.\n🔑 Code: \`${code}\``,
      {
        parse_mode: "Markdown",
      },
    );
  }

  if (status === "active") {
    return bot.sendMessage(
      chatId,
      `✅ You have an *active* subscription.\n\nPackage: *${pkg}*\nExpires: *${expiryDate}*`,
      { parse_mode: "Markdown" },
    );
  }

  if (status === "expired") {
    return bot.sendMessage(
      chatId,
      `⚠️ Your subscription has *expired*.\n\nLast Package: *${pkg}*\nUse /subscribe to renew.`,
      { parse_mode: "Markdown" },
    );
  }

  // Catch unexpected status
  return bot.sendMessage(
    chatId,
    "Something went wrong. Please contact support.",
  );
};

export const test = (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Command executed");
};
