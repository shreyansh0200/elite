import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function fixBuyerTokenIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const db = mongoose.connection.db;
    const collection = db.collection('buyrequests');

    // Step 1: Drop the old index if it exists
    console.log('Dropping old buyerToken index...');
    try {
      await collection.dropIndex('buyerToken_1');
      console.log('✓ Old index dropped');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('✓ Index does not exist, skipping drop');
      } else {
        throw err;
      }
    }

    // Step 2: Remove duplicate null buyerToken entries, keeping only one
    console.log('Cleaning duplicate null buyerToken entries...');
    const nullEntries = await collection
      .find({ buyerToken: null })
      .sort({ createdAt: 1 })
      .toArray();

    if (nullEntries.length > 1) {
      const idsToDelete = nullEntries.slice(1).map((doc) => doc._id);
      const result = await collection.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`✓ Deleted ${result.deletedCount} duplicate null entries`);
    } else {
      console.log('✓ No duplicate null entries found');
    }

    // Step 3: Create the new sparse unique index
    console.log('Creating new sparse unique index on buyerToken...');
    await collection.createIndex({ buyerToken: 1 }, { unique: true, sparse: true });
    console.log('✓ New sparse unique index created');

    console.log('\n✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

fixBuyerTokenIndex();
