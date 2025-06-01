import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const BOT_TOKEN = process.env.BOT_TOKEN;
export const USER_ID = process.env.USER_ID;
export const LOGGING_GROUP_ID = process.env.LOGGING_GROUP_ID;
export const SUBSCRIPTIONSCHANNEL_ID = process.env.SUBSCRIPTIONSCHANNEL_ID;
export const MONGODB_URI = process.env.MONGODB_URI;
export const REQUEST_GROUP_ID = process.env.REQUEST_GROUP_ID;
