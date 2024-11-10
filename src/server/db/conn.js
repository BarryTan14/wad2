import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.MONGODB_URI;
const client = new MongoClient(connectionString, {})
let conn;
try {
    conn = await client.connect();
} catch (e) {
    console.log(e)
}
let db = conn.db("test");
export default db;
