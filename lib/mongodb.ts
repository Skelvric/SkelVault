import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

interface MongoConnection {
  client: MongoClient;
  db: Db;
}

let cachedConnection: MongoConnection | null = null;

export async function connectToDatabase(): Promise<MongoConnection> {
  if (cachedConnection) {
    return cachedConnection;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    cachedConnection = { client, db };
    console.log('🍃 [MongoDB] 🟢 Connection established successfully!');
    return { client, db };
  } catch (error) {
    console.error('🍃 [MongoDB] 🔴 Database connection unsuccessful:', error);
    throw error;
  }
}

export async function getDatabase() {
  const { db } = await connectToDatabase();
  return db;
}

export async function getUsersCollection() {
  const db = await getDatabase();
  return db.collection('Users');
}

export async function getPasswordsCollection() {
  const db = await getDatabase();
  return db.collection('Passwords');
}
