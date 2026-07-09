import  'dotenv/config';
import {MongoClient} from 'mongodb';

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.log('Cannot find email');
    process.exit(1);
  }
  const url = process.env.MONGODB_URI ;
  const dbName = process.env.DB_NAME ;

  const client = new MongoClient(url);
  await client.connect();
  const db = client.db(dbName);

  const result = await db.collection('customers').updateOne({email},
    { $set: { role: 'admin', updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    console.log(`No entry found with email "${email}".`);
  } else {
    console.log(`"${email}" is now an admin.Log in again to get a fresh token with the updated role.`);
  }
  await client.close();
}

run();