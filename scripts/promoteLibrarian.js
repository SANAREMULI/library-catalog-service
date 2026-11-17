require('dotenv').config();
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in .env');
    const email = (await prompt.question('Email of the existing account to promote: ')).trim().toLowerCase();
    if (!email) throw new Error('Enter an email address.');
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOneAndUpdate({ email }, { role: 'librarian' }, { new: true });
    if (!user) throw new Error('No account found with that email. Register it first, then run this command again.');
    console.log(`${user.email} now has the librarian role.`);
  } finally {
    prompt.close();
    if (mongoose.connection.readyState) await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
