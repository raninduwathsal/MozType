import dotenv from 'dotenv';
import { seedLocalDatabase } from './seed-local.js';
import { seedAtlasDatabase } from './seed-atlas.js';

dotenv.config();

const isAtlas = process.argv.includes('--atlas') || process.argv.includes('-a');
const withSample = process.argv.includes('--sample') || process.argv.includes('-s');

if (isAtlas) {
  seedAtlasDatabase(withSample).catch(() => process.exit(1));
} else {
  seedLocalDatabase(withSample).catch(() => process.exit(1));
}
