require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/autism_assistant';
  await mongoose.connect(uri);

  const newPassword = 'Therapist@123';
  const hash = await bcrypt.hash(newPassword, 10);

  const result = await mongoose.connection.collection('users').updateMany(
    { role: 'therapist' },
    { '$set': { password: hash } }
  );

  console.log('Updated', result.modifiedCount, 'therapist accounts to password: Therapist@123');

  // Verify
  const u = await mongoose.connection.collection('users').findOne({ email: 'ananya.sharma@autismassistant.com' });
  const match = await bcrypt.compare(newPassword, u.password);
  console.log('Verification:', match ? 'SUCCESS - password works!' : 'FAILED');

  // List all therapists
  const therapists = await mongoose.connection.collection('users').find({ role: 'therapist' }).toArray();
  console.log('\nAll therapist accounts (use password: Therapist@123):');
  therapists.forEach(t => console.log(' -', t.email, '|', t.name));

  await mongoose.disconnect();
}
resetPasswords().catch(console.error);
