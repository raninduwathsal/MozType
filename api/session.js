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
    const usersCol = db.collection('users');
    const lbCol = db.collection('leaderboards');

    // Parse body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    const { action, username, bestWpm = 0, mode = 'time', mode2 = '15', language = 'english' } = body;
    const cleanUsername = (username || '').trim();

    if (!cleanUsername) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }

    // 1. Check if username is finalized
    if (action === 'check' || action === 'start') {
      const existingUser = await usersCol.findOne({
        username: cleanUsername
      }, { collation: { locale: 'en', strength: 2 } });

      if (existingUser) {
        return res.status(200).json({
          success: false,
          finalized: true,
          error: `Username "${cleanUsername}" is already taken & finalized.`
        });
      }

      return res.status(200).json({
        success: true,
        finalized: false,
        username: cleanUsername
      });
    }

    // 2. Finalize session
    if (action === 'finalize') {
      const now = new Date();

      const userDoc = {
        username: cleanUsername,
        banned: false,
        premium: false,
        createdAt: now,
        updatedAt: now,
        lbPersonalBests: {
          [mode]: {
            [String(mode2)]: {
              [language]: {
                wpm: bestWpm,
                raw: Math.round(bestWpm * 1.05 * 10) / 10,
                acc: 98.5,
                consistency: 88.0,
                timestamp: now
              }
            }
          }
        }
      };

      await usersCol.updateOne(
        { username: cleanUsername },
        { $set: userDoc },
        { upsert: true, collation: { locale: 'en', strength: 2 } }
      );

      // If bestWpm > 0, update leaderboard entry
      if (bestWpm > 0) {
        // Calculate new rank
        const higherCount = await lbCol.countDocuments({
          mode,
          mode2: isNaN(Number(mode2)) ? mode2 : Number(mode2),
          language,
          wpm: { $gt: bestWpm }
        });

        const newRank = higherCount + 1;

        const lbEntry = {
          id: `lb_${Date.now()}_${cleanUsername}`,
          rank: newRank,
          username: cleanUsername,
          wpm: bestWpm,
          rawWpm: Math.round(bestWpm * 1.05 * 10) / 10,
          accuracy: 98.5,
          consistency: 88.0,
          mode: mode,
          mode2: isNaN(Number(mode2)) ? mode2 : Number(mode2),
          language: language,
          timestamp: Date.now(),
          isFinalized: true
        };

        await lbCol.updateOne(
          {
            username: cleanUsername,
            mode,
            mode2: isNaN(Number(mode2)) ? mode2 : Number(mode2),
            language
          },
          { $set: lbEntry },
          { upsert: true, collation: { locale: 'en', strength: 2 } }
        );
      }

      return res.status(200).json({
        success: true,
        message: `Session for "${cleanUsername}" finalized and submitted to MongoDB Atlas!`,
        username: cleanUsername,
        bestWpm
      });
    }

    return res.status(400).json({ success: false, error: 'Invalid action' });
  } catch (error) {
    console.error('Error in /api/session:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}
