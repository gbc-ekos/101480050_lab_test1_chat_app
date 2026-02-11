import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Room from '../models/Room.js';

const rooms = [
  { name: 'devops' },
  { name: 'cloud computing' },
  { name: 'covid19' },
  { name: 'sports' },
  { name: 'nodeJS' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    for (const room of rooms) {
      await Room.findOneAndUpdate(
        { name: room.name },
        room,
        { upsert: true }
      );
      console.log(`Created room: ${room.name}`);
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding:', err);
    process.exit(1);
  }
}

seed();
