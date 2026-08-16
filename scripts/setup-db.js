import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local if present, otherwise .env
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
} else {
  dotenv.config();
}

export const LOCAL_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://admin:password123@localhost:27017/moztype?authSource=admin&directConnection=true';
export const ATLAS_URI = process.env.ATLAS_MONGODB_URI || process.env.MONGODB_URI || '';

export function resolveUri() {
  if (process.argv.includes('--atlas') || process.argv.includes('-a')) {
    if (!ATLAS_URI) {
      console.error('❌ Error: ATLAS_MONGODB_URI or MONGODB_URI is not defined in .env.local or .env');
      process.exit(1);
    }
    return ATLAS_URI;
  }
  if (process.argv.includes('--local') || process.argv.includes('-l')) {
    return LOCAL_URI;
  }
  return process.env.MONGODB_URI || LOCAL_URI;
}

const DB_NAME = process.env.DB_NAME || 'moztype';

export async function setupDatabase(targetUri = resolveUri()) {
  const isAtlas = targetUri.includes('mongodb+srv://');
  const targetLabel = isAtlas ? '🌐 MongoDB Atlas Online Cluster' : '🐳 Local Docker Container';

  console.log(`\n======================================================`);
  console.log(`⚡ MozType MongoDB Schema Setup & Migration`);
  console.log(`Target: ${targetLabel}`);
  console.log(`Connection: ${targetUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
  console.log(`Database: ${DB_NAME}`);
  console.log(`======================================================\n`);

  const client = new MongoClient(targetUri);

  try {
    await client.connect();
    console.log('✓ Successfully connected to MongoDB cluster.');

    const db = client.db(DB_NAME);

    // 1. Check existing collections
    const existingCollections = (await db.listCollections().toArray()).map(c => c.name);

    // ----------------------------------------------------
    // Collection 1: users
    // ----------------------------------------------------
    console.log('\n[1/4] Configuring collection: `users`...');
    if (!existingCollections.includes('users')) {
      await db.createCollection('users', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['username', 'createdAt'],
            properties: {
              username: {
                bsonType: 'string',
                description: 'Unique user handle (2-25 characters)'
              },
              email: {
                bsonType: ['string', 'null'],
                description: 'Optional user email address'
              },
              banned: {
                bsonType: 'bool',
                description: 'Anti-cheat flag'
              },
              badge: {
                bsonType: ['string', 'null'],
                description: 'Display badge (Champion, Grandmaster, etc.)'
              },
              premium: {
                bsonType: 'bool',
                description: 'Supporter status'
              },
              lbPersonalBests: {
                bsonType: 'object',
                description: 'Nested map of personal bests categorized by mode, mode2, and language'
              },
              createdAt: {
                bsonType: 'date',
                description: 'Account registration timestamp'
              },
              updatedAt: {
                bsonType: 'date',
                description: 'Last update timestamp'
              }
            }
          }
        }
      });
      console.log('  + Created `users` collection with JSON Schema validator.');
    } else {
      console.log('  ✓ `users` collection already exists.');
    }

    // Indexes for `users`
    const usersCol = db.collection('users');
    await usersCol.createIndex(
      { username: 1 },
      { unique: true, collation: { locale: 'en', strength: 2 }, name: 'uniq_username_case_insensitive' }
    );
    await usersCol.createIndex({ email: 1 }, { unique: true, sparse: true, name: 'uniq_email_sparse' });
    await usersCol.createIndex({ banned: 1 }, { name: 'idx_banned' });
    await usersCol.createIndex({ "lbPersonalBests.time.15.english.wpm": -1 }, { name: 'idx_pb_time_15' });
    await usersCol.createIndex({ "lbPersonalBests.time.60.english.wpm": -1 }, { name: 'idx_pb_time_60' });
    await usersCol.createIndex({ "lbPersonalBests.words.50.english.wpm": -1 }, { name: 'idx_pb_words_50' });
    console.log('  ✓ Verified unique & query indexes on `users`.');

    // ----------------------------------------------------
    // Collection 2: results
    // ----------------------------------------------------
    console.log('\n[2/4] Configuring collection: `results`...');
    if (!existingCollections.includes('results')) {
      await db.createCollection('results', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['username', 'mode', 'mode2', 'wpm', 'acc', 'duration', 'timestamp'],
            properties: {
              uid: {
                bsonType: ['string', 'objectId', 'null'],
                description: 'User document reference'
              },
              username: {
                bsonType: 'string',
                description: 'Typist handle'
              },
              mode: {
                enum: ['time', 'words', 'quote', 'zen', 'custom'],
                description: 'Test mode type'
              },
              mode2: {
                bsonType: ['string', 'int', 'double'],
                description: 'Mode secondary configuration (15, 60, 50, medium, etc.)'
              },
              language: {
                bsonType: 'string',
                description: 'Language dictionary used (e.g. english)'
              },
              wpm: {
                bsonType: 'number',
                description: 'Calculated standardized Words Per Minute'
              },
              raw: {
                bsonType: 'number',
                description: 'Raw Words Per Minute'
              },
              acc: {
                bsonType: 'number',
                description: 'Accuracy percentage (0 - 100)'
              },
              consistency: {
                bsonType: 'number',
                description: 'Kogasa rhythm consistency percentage'
              },
              duration: {
                bsonType: 'number',
                description: 'Elapsed test time in seconds'
              },
              charStats: {
                bsonType: 'array',
                description: '[correct, incorrect, extra, missed] count array'
              },
              modifiers: {
                bsonType: 'object',
                description: 'Modifiers active during test'
              },
              isPb: {
                bsonType: 'bool',
                description: 'Whether test set a new personal record'
              },
              timestamp: {
                bsonType: 'date',
                description: 'Test completion timestamp'
              }
            }
          }
        }
      });
      console.log('  + Created `results` collection with JSON Schema validator.');
    } else {
      console.log('  ✓ `results` collection already exists.');
    }

    // Indexes for `results`
    const resultsCol = db.collection('results');
    await resultsCol.createIndex({ username: 1, timestamp: -1 }, { name: 'idx_user_history' });
    await resultsCol.createIndex({ mode: 1, mode2: 1, wpm: -1 }, { name: 'idx_mode_wpm' });
    await resultsCol.createIndex({ timestamp: -1 }, { name: 'idx_timestamp' });
    console.log('  ✓ Verified query indexes on `results`.');

    // ----------------------------------------------------
    // Collection 3: leaderboards (Unified Cached Table)
    // ----------------------------------------------------
    console.log('\n[3/4] Configuring collection: `leaderboards`...');
    if (!existingCollections.includes('leaderboards')) {
      await db.createCollection('leaderboards');
      console.log('  + Created `leaderboards` collection.');
    } else {
      console.log('  ✓ `leaderboards` collection already exists.');
    }

    // Indexes for `leaderboards`
    const lbCol = db.collection('leaderboards');
    await lbCol.createIndex(
      { mode: 1, mode2: 1, language: 1, rank: 1 },
      { name: 'idx_lb_pagination' }
    );
    await lbCol.createIndex(
      { mode: 1, mode2: 1, language: 1, username: 1 },
      { unique: true, name: 'uniq_user_per_lb_category' }
    );
    console.log('  ✓ Verified ranking & pagination indexes on `leaderboards`.');

    // ----------------------------------------------------
    // Collection 4: configs
    // ----------------------------------------------------
    console.log('\n[4/4] Configuring collection: `configs`...');
    if (!existingCollections.includes('configs')) {
      await db.createCollection('configs');
      const configsCol = db.collection('configs');
      await configsCol.updateOne(
        { key: 'app_config' },
        {
          $setOnInsert: {
            key: 'app_config',
            appName: 'MozType',
            version: '1.0.0',
            antiCheatMinIntervalMs: 30,
            antiCheatMinAccuracy: 75,
            rankedModes: [
              { mode: 'time', mode2: '15', language: 'english' },
              { mode: 'time', mode2: '60', language: 'english' },
              { mode: 'words', mode2: '50', language: 'english' },
              { mode: 'quote', mode2: 'medium', language: 'english' }
            ],
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log('  + Initialized system `configs` with baseline rules.');
    } else {
      console.log('  ✓ `configs` collection already exists.');
    }

    console.log(`\n✅ [${targetLabel}] Database schema setup & indexes completed successfully!\n`);
  } catch (error) {
    console.error(`\n❌ Error setting up database schema on ${targetLabel}:`, error);
    throw error;
  } finally {
    await client.close();
  }
}

if (process.argv[1].endsWith('setup-db.js') || process.argv[1].endsWith('setup-db.ts')) {
  setupDatabase().catch(() => process.exit(1));
}
