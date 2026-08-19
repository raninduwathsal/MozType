import { connectToDatabase } from './lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const lbCol = db.collection('leaderboards');

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const mode = url.searchParams.get('mode') || 'time';
    const mode2 = url.searchParams.get('mode2') || '15';
    const language = url.searchParams.get('language') || 'english';
    const search = url.searchParams.get('search') || '';

    const query = {
      mode: mode,
      mode2: isNaN(Number(mode2)) ? mode2 : Number(mode2),
      language: language
    };

    if (search.trim()) {
      query.username = { $regex: search.trim(), $options: 'i' };
    }

    const statusFilter = url.searchParams.get('status') || 'all'; // 'all' | 'finalized' | 'pending'
    if (statusFilter === 'finalized') {
      query.isFinalized = true;
    } else if (statusFilter === 'pending') {
      query.isFinalized = { $ne: true };
    }

    // Try matching with numeric mode2, fallback to string if necessary
    let entries = await lbCol
      .find(query)
      .sort({ wpm: -1, accuracy: -1, timestamp: 1 })
      .limit(250)
      .toArray();

    if (entries.length === 0 && !isNaN(Number(mode2))) {
      query.mode2 = String(mode2);
      entries = await lbCol
        .find(query)
        .sort({ wpm: -1, accuracy: -1, timestamp: 1 })
        .limit(250)
        .toArray();
    }

    // Assign dynamic 1-indexed ranks and guarantee isFinalized flag
    const rankedEntries = entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isFinalized: Boolean(entry.isFinalized)
    }));

    console.log(`[Vercel Serverless /api/leaderboard] Query: mode=${mode}, mode2=${mode2}, status=${statusFilter}, search="${search}" | Found: ${rankedEntries.length} typists`);

    return res.status(200).json({
      success: true,
      data: rankedEntries,
      count: rankedEntries.length,
      mode,
      mode2,
      language
    });
  } catch (error) {
    console.error('[Vercel Serverless Error /api/leaderboard]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}
