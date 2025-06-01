import { MongoClient } from 'mongodb';
import { BOT_TOKEN } from '../config/env.js';
// import { MONGODB_URI } from '../config/env.js';



// const uri = MONGODB_URI

console.log('BOT_TOKEN', BOT_TOKEN)

console.log(uri)

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true, 
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db('telegram_bot'); // change if you used a different DB name
    const collections = await db.listCollections().toArray();
    console.log('📦 Available collections:', collections.map(c => c.name));
  } catch (err) {
    console.error('❌ Connection failed:', err);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

testConnection();
