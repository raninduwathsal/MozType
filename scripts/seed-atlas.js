import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { setupDatabase, ATLAS_URI } from './setup-db.js';
import { updateLeaderboards } from './update-leaderboards.js';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'moztype';

export async function seedAtlasDatabase(withSample = false) {
  console.log(`\n======================================================`);
  console.log(`🌐 MozType MongoDB Atlas Online Cluster Seed Runner`);
  console.log(`Cluster: moztypecluster.j4j2gtq.mongodb.net`);
  console.log(`Database: ${DB_NAME}`);
  console.log(`Sample Benchmark Typists: ${withSample ? 'ENABLED' : 'DISABLED (Clean Cluster)'}`);
  console.log(`======================================================\n`);

  // 1. Run schema and index setup on Atlas
  await setupDatabase(ATLAS_URI);

  // 2. Optional sample typists
  if (withSample) {
    console.log('\n[Optional] Seeding online cluster benchmark typists...');
    const client = new MongoClient(ATLAS_URI);
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      const usersCol = db.collection('users');

      const sampleUsers = [
        {
          username: "ApexTyper",
          email: "apex@moztype.dev",
          banned: false,
          badge: "👑 Champion",
          premium: true,
          createdAt: new Date(Date.now() - 86400000 * 30),
          updatedAt: new Date(),
          lbPersonalBests: {
            time: {
              "15": { english: { wpm: 172.5, raw: 178.0, acc: 99.1, consistency: 92.4, timestamp: new Date(Date.now() - 86400000 * 5) } },
              "30": { english: { wpm: 164.0, raw: 170.2, acc: 98.8, consistency: 90.1, timestamp: new Date(Date.now() - 86400000 * 6) } },
              "60": { english: { wpm: 158.0, raw: 164.2, acc: 98.6, consistency: 89.1, timestamp: new Date(Date.now() - 86400000 * 4) } }
            },
            words: {
              "50": { english: { wpm: 165.2, raw: 170.0, acc: 98.9, consistency: 90.5, timestamp: new Date(Date.now() - 86400000 * 3) } }
            }
          }
        },
        {
          username: "KeyMaster_Pro",
          email: "keymaster@moztype.dev",
          banned: false,
          badge: "⚡ Grandmaster",
          premium: true,
          createdAt: new Date(Date.now() - 86400000 * 20),
          updatedAt: new Date(),
          lbPersonalBests: {
            time: {
              "15": { english: { wpm: 154.2, raw: 160.0, acc: 98.4, consistency: 87.2, timestamp: new Date(Date.now() - 86400000 * 8) } },
              "60": { english: { wpm: 142.0, raw: 148.5, acc: 97.8, consistency: 85.0, timestamp: new Date(Date.now() - 86400000 * 7) } }
            }
          }
        },
        {
          username: "VeloType",
          email: "velo@moztype.dev",
          banned: false,
          badge: "🔥 Master",
          premium: false,
          createdAt: new Date(Date.now() - 86400000 * 15),
          updatedAt: new Date(),
          lbPersonalBests: {
            time: {
              "15": { english: { wpm: 140.6, raw: 145.0, acc: 98.0, consistency: 86.4, timestamp: new Date(Date.now() - 86400000 * 10) } }
            }
          }
        }
      ];

      for (const u of sampleUsers) {
        await usersCol.updateOne({ username: u.username }, { $set: u }, { upsert: true });
      }
      console.log(`  ✓ Inserted/Updated ${sampleUsers.length} sample typist records in MongoDB Atlas.`);
    } finally {
      await client.close();
    }
  }

  // 3. Compile leaderboards on Atlas
  await updateLeaderboards(ATLAS_URI);

  console.log(`\n🎉 MongoDB Atlas Online Cluster is fully initialized, migrated, and ready for production!\n`);
}

const withSample = process.argv.includes('--sample') || process.argv.includes('-s');
seedAtlasDatabase(withSample).catch(() => process.exit(1));
