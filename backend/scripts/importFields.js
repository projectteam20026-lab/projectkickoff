'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Field    = require('../src/models/Field');
const fields   = require('../seeds/fields.seed');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const deleted = await Field.deleteMany({});
    console.log(`Deleted ${deleted.deletedCount} existing fields`);

    const inserted = await Field.insertMany(fields, { ordered: false });
    console.log(`Imported ${inserted.length} fields successfully`);

    const byCity = inserted.reduce((acc, f) => {
      acc[f.city] = (acc[f.city] || 0) + 1;
      return acc;
    }, {});
    console.log('\nFields per city:');
    Object.entries(byCity).forEach(([city, count]) => {
      console.log(`  ${city}: ${count}`);
    });

  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
})();
