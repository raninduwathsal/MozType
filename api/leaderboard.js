import { connectToDatabase } from './lib/db.js';

export default async function handler(req, res) {
  // Enable CORS for API requests
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

    // Try matching with string mode2 as fallback if number doesn't match
    let entries = await lbCol.find(query).sort({ rank: 1 }).limit(100).toArray();
    if (entries.length === 0 && !isNaN(Number(mode2))) {
      query.mode2 = String(mode2);
      entries = await lbCol.find(query).sort({ rank: 1 }).limit(100).toArray();
    }

    return res.status(200).json({
      success: true,
      data: entries,
      count: entries.length,
      mode,
      mode2,
      language
    });
  } catch (error) {
    console.error('Error in /api/leaderboard:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}
