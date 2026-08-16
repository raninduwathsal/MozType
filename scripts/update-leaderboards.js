import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { LOCAL_URI, ATLAS_URI, resolveUri } from './setup-db.js';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'moztype';

const RANKED_CONFIGS = [
  { mode: 'time', mode2: '15', language: 'english' },
  { mode: 'time', mode2: '30', language: 'english' },
  { mode: 'time', mode2: '60', language: 'english' },
  { mode: 'time', mode2: '120', language: 'english' },
  { mode: 'words', mode2: '10', language: 'english' },
  { mode: 'words', mode2: '25', language: 'english' },
  { mode: 'words', mode2: '50', language: 'english' },
  { mode: 'words', mode2: '100', language: 'english' },
  { mode: 'quote', mode2: 'short', language: 'english' },
  { mode: 'quote', mode2: 'medium', language: 'english' },
  { mode: 'quote', mode2: 'long', language: 'english' },
  { mode: 'quote', mode2: 'thicc', language: 'english' }
];

export async function updateLeaderboards(targetUri = resolveUri()) {
  const isAtlas = targetUri.includes('mongodb+srv://');
  const targetLabel = isAtlas ? '🌐 MongoDB Atlas Online Cluster' : '🐳 Local Docker Container';

  console.log(`\n======================================================`);
  console.log(`🏆 MozType Leaderboard Aggregation Worker`);
  console.log(`Target: ${targetLabel}`);
  console.log(`Running MongoDB $setWindowFields pipelines...`);
  console.log(`======================================================\n`);

  const client = new MongoClient(targetUri);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCol = db.collection('users');
    const lbCol = db.collection('leaderboards');

    let totalAggregated = 0;

    for (const config of RANKED_CONFIGS) {
      const { mode, mode2, language } = config;
      const pbPath = `lbPersonalBests.${mode}.${mode2}.${language}`;

      // MongoDB Aggregation Pipeline per Section 4.3 of clean-room spec
      const pipeline = [
        // 1. $match: Filter out banned users and users without a PB in this category
        {
          $match: {
            banned: { $ne: true },
            [`${pbPath}.wpm`]: { $gt: 0 }
          }
        },
        // 2. $sort: Sort by WPM descending, accuracy descending, timestamp ascending (earlier PB wins tie)
        {
          $sort: {
            [`${pbPath}.wpm`]: -1,
            [`${pbPath}.acc`]: -1,
            [`${pbPath}.timestamp`]: 1
          }
        },
        // 3. $setWindowFields: Calculate absolute rank (row number 1, 2, 3...)
        {
          $setWindowFields: {
            sortBy: {
              [`${pbPath}.wpm`]: -1
            },
            output: {
              rank: { $documentNumber: {} }
            }
          }
        },
        // 4. $project: Format into clean Leaderboard document shape
        {
          $project: {
            _id: 0,
            id: { $concat: ["lb_", { $toString: "$_id" }, "_", mode, "_", String(mode2)] },
            uid: "$_id",
            username: "$username",
            wpm: `$${pbPath}.wpm`,
            rawWpm: `$${pbPath}.raw`,
            accuracy: `$${pbPath}.acc`,
            consistency: `$${pbPath}.consistency`,
            timestamp: `$${pbPath}.timestamp`,
            badge: "$badge",
            mode: mode,
            mode2: mode2,
            language: language,
            isFinalized: true
          }
        }
      ];

      const rankedDocs = await usersCol.aggregate(pipeline).toArray();

      // Clear existing records for this category and insert fresh compiled ranks
      await lbCol.deleteMany({ mode, mode2, language });

      if (rankedDocs.length > 0) {
        await lbCol.insertMany(rankedDocs);
        totalAggregated += rankedDocs.length;
        console.log(`  ✓ [${mode} / ${mode2} / ${language}] Compiled ${rankedDocs.length} ranked typists. Top: ${Math.round(rankedDocs[0].wpm)} WPM (@${rankedDocs[0].username})`);
      }
    }

    console.log(`\n✅ Leaderboard compilation complete on ${targetLabel}! Cached ${totalAggregated} total rankings.\n`);
  } catch (error) {
    console.error(`\n❌ Error updating leaderboards on ${targetLabel}:`, error);
    throw error;
  } finally {
    await client.close();
  }
}

if (process.argv[1].endsWith('update-leaderboards.js') || process.argv[1].endsWith('update-leaderboards.ts')) {
  updateLeaderboards().catch(() => process.exit(1));
}
