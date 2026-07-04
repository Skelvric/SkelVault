import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

interface MongoConnection {
  client: MongoClient;
  db: Db;
}

let cachedConnection: MongoConnection | null = null;
let indexesEnsured = false;

export async function connectToDatabase(): Promise<MongoConnection> {
  if (cachedConnection) {
    return cachedConnection;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    cachedConnection = { client, db };
    await ensureIndexes(db);
    console.log('🍃 [MongoDB] 🟢 Connection established successfully.');
    return { client, db };
  } catch (error) {
    console.error('🍃 [MongoDB] 🔴 Database connection unsuccessful:', error);
    throw error;
  }
}

async function ensureIndexes(db: Db) {
  if (indexesEnsured) return;
  try {
    await db.collection('Users').createIndex({ email: 1 }, { unique: true });
    await db.collection('Passwords').createIndex({ userId: 1 });

    await db.collection('Sessions').createIndex({ userId: 1 });
    await db.collection('Sessions').createIndex({ sessionId: 1 }, { unique: true });
    await db.collection('Sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    await db.collection('RateLimits').createIndex({ key: 1 }, { unique: true });
    await db.collection('RateLimits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    indexesEnsured = true;
  } catch (error) {
    console.error('🍃 [MongoDB] 🟡 Failed to ensure indexes:', error);
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

export async function getSessionsCollection() {
  const db = await getDatabase();
  return db.collection('Sessions');
}

export async function getRateLimitsCollection() {
  const db = await getDatabase();
  return db.collection('RateLimits');
}
