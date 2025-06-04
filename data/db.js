// db.js
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { MONGODB_URI } from "../config/env.js";

dotenv.config(); // Load variables from .env.prod

// const uri = "mongodb+srv://user1:user1234@cluster0.8j17ibf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri = MONGODB_URI;

if (!uri) {
  throw new Error("❌ MONGODB_URI not found in environment variables");
}

const client = new MongoClient(uri); // No options needed
let db;

export async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db(); // Uses DB name from connection string
    console.log("✅ MongoDB connected");
  }
  return db;
}
