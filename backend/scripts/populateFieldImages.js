'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Field    = require('../src/models/Field');

// ── Everything we're allowed to replace ──────────────────────────────────────
// Original seed images (w=800) + anything my previous bad migration set
const SEED_IMAGES = new Set([
  // Old Unsplash from utils/seed.js
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070&auto=format&fit=crop',
  // 8 Pexels from fields.seed.js (w=800)
  'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/47730/the-ball-stadion-football-stadium-47730.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/16826134/pexels-photo-16826134.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/12486370/pexels-photo-12486370.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/15153169/pexels-photo-15153169.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/16114080/pexels-photo-16114080.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/17203165/pexels-photo-17203165.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/21561836/pexels-photo-21561836.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Bad images from my previous migration run (w=1200 versions + wrong IDs) — replace these too
  'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/47730/the-ball-stadion-football-stadium-47730.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/16826134/pexels-photo-16826134.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/12486370/pexels-photo-12486370.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/15153169/pexels-photo-15153169.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/16114080/pexels-photo-16114080.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/17203165/pexels-photo-17203165.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/21561836/pexels-photo-21561836.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2209825/pexels-photo-2209825.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/3140024/pexels-photo-3140024.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1884572/pexels-photo-1884572.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/5409554/pexels-photo-5409554.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/4494647/pexels-photo-4494647.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/3148452/pexels-photo-3148452.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571019613576-4c5d74ab2b34?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551280857-2b9bbe52acf4?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552580411-71ce3024a2c2?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527979809431-ea3d5c0c01c9?q=80&w=1200&auto=format&fit=crop',
]);

// ── ONLY the 2 Pexels images whose filenames literally say "football" ─────────
// photo 46798 = "the-ball-stadion-football-the-pitch" (aerial green pitch)
// photo 47730 = "the-ball-stadion-football-stadium"   (stadium aerial)
// + the original confirmed Unsplash aerial pitch
const IMAGE_POOL = [
  'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
  'https://images.pexels.com/photos/47730/the-ball-stadion-football-stadium-47730.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200&auto=format&fit=crop',
];

// Returns true if all images in the array are default seed images (safe to replace)
function isDefaultOnly(images) {
  if (!images || images.length === 0) return true;
  return images.every(img => SEED_IMAGES.has(img));
}

// Pick 1 image per field, rotating through the pool for variety
function pickImages(idx) {
  return [IMAGE_POOL[idx % IMAGE_POOL.length]];
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    console.log('✅  Connected to MongoDB\n');

    const allFields = await Field.find({}).sort({ createdAt: 1 }).lean();
    console.log(`Found ${allFields.length} fields in database\n`);

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < allFields.length; i++) {
      const field = allFields[i];
      if (isDefaultOnly(field.images)) {
        const newImages = pickImages(i);
        await Field.updateOne({ _id: field._id }, { $set: { images: newImages } });
        updated++;
        console.log(`  ✓ [${field.city}] ${field.name}`);
      } else {
        skipped++;
        console.log(`  ↷ SKIPPED (has custom images): [${field.city}] ${field.name}`);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  Updated : ${updated} fields`);
    console.log(`  Skipped : ${skipped} fields (custom images preserved)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (err) {
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
})();
