'use strict';

/**
 * Migration: update all existing field documents with confirmed
 * football-field images. Run once: node seeds/migrate-field-images.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Field = require('../src/models/Field');

const IMGS = [
  'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/47730/the-ball-stadion-football-stadium-47730.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1487466365202-1afdb86c764e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?auto=format&fit=crop&w=800&q=80',
];

const img = (i) => [IMGS[i % IMGS.length], IMGS[(i + 3) % IMGS.length]];

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const fields = await Field.find({}).sort({ createdAt: 1 });
  console.log(`Found ${fields.length} fields — updating images...`);

  let updated = 0;
  for (let i = 0; i < fields.length; i++) {
    fields[i].images = img(i);
    await fields[i].save();
    updated++;
    if (updated % 10 === 0) console.log(`  ${updated}/${fields.length} updated`);
  }

  console.log(`\n✅ Done — updated ${updated} field(s) with football images.`);
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
