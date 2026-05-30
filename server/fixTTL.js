require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const col = db.collection('statuses');

  // List existing indexes
  const indexes = await col.indexes();
  console.log('Current indexes:', indexes.map(i => i.name));

  // Drop any old TTL index on expiresAt
  for (const idx of indexes) {
    if (idx.key && idx.key.expiresAt !== undefined && idx.name !== '_id_') {
      console.log(`Dropping old index: ${idx.name}`);
      await col.dropIndex(idx.name);
    }
  }

  // Create correct TTL index
  await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  console.log('✅ TTL index created: expiresAt (expireAfterSeconds: 0)');

  // Also delete any already-expired documents right now
  const result = await col.deleteMany({ expiresAt: { $lt: new Date() } });
  console.log(`🗑  Deleted ${result.deletedCount} already-expired status(es)`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => { console.error(err.message); process.exit(1); });
