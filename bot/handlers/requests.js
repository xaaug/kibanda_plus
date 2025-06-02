// import { REQUEST_GROUP_ID } from '../../config/env.js';
import bot from "../botInstance.js";
import { userStates } from "../states.js";

const REQUEST_GROUP_ID = -4969657849;

export const processRequestInput = (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || `ID: ${msg.from.id}`;
  const query = msg.text?.trim();

  // console.log(REQUEST_GROUP_ID)

  if (!query) {
    return bot.sendMessage(
      chatId,
      "🚫 You sent an empty request. Hit me with the movie name, please.",
    );
  }

  bot.sendMessage(
    chatId,
    `📬 Request received!\nWe’ll get to it if it aligns with the cosmic algorithm.`,
  );

  bot.sendMessage(
    REQUEST_GROUP_ID,
    `📩 *New Content Request*\nUser: @${username}\nMovie: ${query}`,
    { parse_mode: "Markdown" },
  );

  delete userStates[chatId]; // Clean up state
};
