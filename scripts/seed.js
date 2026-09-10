import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../backend/config/db.js';
import User from '../backend/models/User.js';
import MarketListing from '../backend/models/MarketListing.js';
import Slot from '../backend/models/Slot.js';

await connectDB();

const hubDemos = [
  { city: 'Kanpur', username: 'hub_kanpur', password: 'Kanpur@123', name: 'Rajesh Kumar' },
  { city: 'Lucknow', username: 'hub_lucknow', password: 'Lucknow@123', name: 'Amit Verma' },
  { city: 'Prayagraj', username: 'hub_prayagraj', password: 'Prayagraj@123', name: 'Neeraj Singh' },
  { city: 'Varanasi', username: 'hub_varanasi', password: 'Varanasi@123', name: 'Pankaj Yadav' },
  { city: 'Agra', username: 'hub_agra', password: 'Agra@123', name: 'Suresh Sharma' },
  { city: 'Meerut', username: 'hub_meerut', password: 'Meerut@123', name: 'Vivek Tyagi' },
  { city: 'Gorakhpur', username: 'hub_gorakhpur', password: 'Gorakhpur@123', name: 'Manoj Gupta' },
  { city: 'Bareilly', username: 'hub_bareilly', password: 'Bareilly@123', name: 'Anil Saxena' },
  { city: 'Jhansi', username: 'hub_jhansi', password: 'Jhansi@123', name: 'Deepak Tiwari' },
  { city: 'Aligarh', username: 'hub_aligarh', password: 'Aligarh@123', name: 'Rohit Chauhan' },
];

const today = new Date();
const dateStr = (offset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const hubs = [];
for (const demo of hubDemos) {
  const passwordHash = await bcrypt.hash(demo.password, 12);
  const hub = await User.findOneAndUpdate(
    { role: 'hubmanager', username: demo.username },
    {
      $set: {
        name: demo.name,
        city: demo.city,
        location: `${demo.city}, Uttar Pradesh`,
        passwordHash,
        active: true,
      },
      $setOnInsert: {
        username: demo.username,
        role: 'hubmanager',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  hubs.push(hub);
}

const cropRows = [
  ['Wheat', 40, 2450],
  ['Rice', 25, 2200],
  ['Pulses', 15, 6200],
  ['Potato', 35, 1800],
  ['Mustard', 20, 5400],
  ['Maize', 30, 2100],
  ['Sugarcane', 55, 3700],
  ['Peas', 18, 4600],
  ['Gram', 22, 5800],
  ['Barley', 28, 2300],
];

for (let i = 0; i < hubs.length; i += 1) {
  const hub = hubs[i];
  const [cropType, quantity, pricePerUnit] = cropRows[i];
  const existingStock = await MarketListing.findOne({
    hubManagerId: hub._id,
    city: hub.city,
    cropType,
    sourceRequestId: { $exists: false },
  });

  if (!existingStock) {
    await MarketListing.create({
      farmerName: `Demo Farmer - ${hub.city}`,
      hubManagerId: hub._id,
      city: hub.city,
      cropType,
      description: `Sample ${cropType.toLowerCase()} stock for ${hub.city} hub`,
      totalQuantity: quantity,
      availableQuantity: quantity,
      quantityUnit: 'Quintal',
      pricePerUnit,
      location: `AgriSync Hub, ${hub.city}`,
      status: 'active',
    });
  }

  const hasSlot = await Slot.exists({ hubManagerId: hub._id, city: hub.city });
  if (!hasSlot) {
    await Slot.insertMany([
      {
        hubManagerId: hub._id,
        city: hub.city,
        date: dateStr(1),
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        location: `AgriSync Hub, ${hub.city}`,
        capacityQuintal: 72,
      },
      {
        hubManagerId: hub._id,
        city: hub.city,
        date: dateStr(1),
        startTime: '11:00 AM',
        endTime: '12:00 PM',
        location: `AgriSync Hub, ${hub.city}`,
        capacityQuintal: 36,
      },
    ]);
  }
}

// Backfill old listings that have a city but were created before hub ownership.
const legacyListings = await MarketListing.find({ $or: [{ hubManagerId: { $exists: false } }, { hubManagerId: null }] });
for (const listing of legacyListings) {
  const city = String(listing.city || '').trim();
  if (!city) continue;
  const hub = hubs.find((item) => item.city.toLowerCase() === city.toLowerCase());
  if (hub) {
    listing.hubManagerId = hub._id;
    listing.city = hub.city;
    await listing.save();
  }
}

console.log('Seed complete. 10 city-specific hub managers were created/updated.');
console.table(hubDemos.map(({ city, username, password }) => ({ city, username, password })));
process.exit(0);
