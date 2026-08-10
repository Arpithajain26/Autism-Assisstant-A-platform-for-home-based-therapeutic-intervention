require('dotenv').config();

const { connectDB } = require('../config/db');
const Child = require('../models/Child');
const Activity = require('../models/Activity');

async function run() {
  try {
    await connectDB();

    const level2Acts = await Activity.find({ level: 2 }).select('_id');
    if (!level2Acts || level2Acts.length === 0) {
      console.log('No Level 2 activities found in the DB. Ensure activities are seeded.');
      process.exit(0);
    }

    const level2Ids = level2Acts.map((a) => a._id);

    // Find demo child by name or fallback to first child
    let child = await Child.findOne({ name: 'Timmy Johnson' });
    if (!child) {
      child = await Child.findOne();
      if (!child) {
        console.log('No child records found in DB. Create a child first or run the seed.');
        process.exit(0);
      }
      console.log(`Demo child 'Timmy Johnson' not found. Using first child: ${child.name}`);
    }

    const current = Array.isArray(child.assignedTasks) ? child.assignedTasks : [];
    const toAdd = level2Ids.filter((id) => !current.includes(id));

    if (toAdd.length === 0) {
      console.log(`Child '${child.name}' already has all Level 2 activities assigned.`);
    } else {
      child.assignedTasks = Array.from(new Set([...current, ...level2Ids]));
      await child.save();
      console.log(`Assigned ${toAdd.length} Level 2 activities to child '${child.name}'.`);
    }

    // Optionally print the assignedTasks for verification
    console.log('Assigned tasks now:', child.assignedTasks);
    process.exit(0);
  } catch (err) {
    console.error('Error assigning Level 2 activities:', err);
    process.exit(1);
  }
}

run();
