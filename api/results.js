import { connectToDatabase } from './lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const resultsCol = db.collection('results');

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    const {
      username = 'Guest',
      mode = 'time',
      mode2 = 15,
      language = 'english',
      wpm = 0,
      raw = 0,
      acc = 100,
      consistency = 100,
      duration = 15,
      charStats = [0, 0, 0, 0],
      modifiers = {},
      isPb = false
    } = body;

    const resultDoc = {
      username: username.trim(),
      mode,
      mode2: isNaN(Number(mode2)) ? mode2 : Number(mode2),
      language,
      wpm: Number(wpm),
      raw: Number(raw),
      acc: Number(acc),
      consistency: Number(consistency),
      duration: Number(duration),
      charStats,
      modifiers,
      isPb: Boolean(isPb),
      timestamp: new Date()
    };

    const insertResult = await resultsCol.insertOne(resultDoc);

    return res.status(201).json({
      success: true,
      id: insertResult.insertedId,
      message: 'Result recorded successfully in MongoDB Atlas'
    });
  } catch (error) {
    console.error('Error in /api/results:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}
