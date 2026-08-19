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

      const isFinalized = Boolean(existingUser);
      console.log(`[Vercel Serverless /api/session] Username check for "${cleanUsername}": ${isFinalized ? 'TAKEN & FINALIZED' : 'AVAILABLE'}`);

      if (isFinalized) {
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

    // 2. Update pending score for active session (not finalized)
    if (action === 'update-score' || action === 'submit-pending') {
      const numWpm = Number(body.wpm ?? bestWpm);
      const numRaw = Number(body.rawWpm ?? body.raw ?? Math.round(numWpm * 1.05 * 10) / 10);
      const numAcc = Number(body.accuracy ?? body.acc ?? 98.5);
      const numConsistency = Number(body.consistency ?? 88.0);
      const numMode2 = isNaN(Number(mode2)) ? mode2 : Number(mode2);

      if (numWpm > 0) {
        // Find if an entry already exists
        const existingEntry = await lbCol.findOne({
          username: cleanUsername,
          mode,
          mode2: numMode2,
          language
        });

        // Only update if no existing entry, or existing is not finalized, or new score is higher
        if (!existingEntry || numWpm >= existingEntry.wpm) {
          const higherCount = await lbCol.countDocuments({
            mode,
            mode2: numMode2,
            language,
            wpm: { $gt: numWpm }
          });

          const currentRank = higherCount + 1;
          const isUserFinalized = existingEntry ? Boolean(existingEntry.isFinalized) : false;

          const pendingEntry = {
            id: existingEntry?.id || `lb_${Date.now()}_${cleanUsername}`,
            rank: currentRank,
            username: cleanUsername,
            wpm: numWpm,
            rawWpm: numRaw,
            accuracy: numAcc,
            consistency: numConsistency,
            mode,
            mode2: numMode2,
            language,
            timestamp: Date.now(),
            isFinalized: isUserFinalized // Keep finalized if already finalized, else false (pending)
          };

          await lbCol.updateOne(
            {
              username: cleanUsername,
              mode,
              mode2: numMode2,
              language
            },
            { $set: pendingEntry },
            { upsert: true, collation: { locale: 'en', strength: 2 } }
          );

          console.log(`[Vercel Serverless /api/session] Updated provisional score for @${cleanUsername}: ${numWpm} WPM (Rank #${currentRank}, Finalized: ${isUserFinalized})`);

          return res.status(200).json({
            success: true,
            message: 'Pending score updated on leaderboard',
            rank: currentRank,
            isFinalized: isUserFinalized,
            wpm: numWpm
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'No score update required',
        wpm: numWpm
      });
    }

    // 3. Finalize session
    if (action === 'finalize') {
      const now = new Date();
      const numWpm = Number(body.wpm ?? bestWpm);
      const numRaw = Number(body.rawWpm ?? body.raw ?? Math.round(numWpm * 1.05 * 10) / 10);
      const numAcc = Number(body.accuracy ?? body.acc ?? 98.5);
      const numConsistency = Number(body.consistency ?? 88.0);
      const numMode2 = isNaN(Number(mode2)) ? mode2 : Number(mode2);

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
                wpm: numWpm,
                raw: numRaw,
                acc: numAcc,
                consistency: numConsistency,
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

      // If wpm > 0, finalize leaderboard entry
      if (numWpm > 0) {
        const higherCount = await lbCol.countDocuments({
          mode,
          mode2: numMode2,
          language,
          wpm: { $gt: numWpm }
        });

        const newRank = higherCount + 1;

        const lbEntry = {
          id: `lb_${Date.now()}_${cleanUsername}`,
          rank: newRank,
          username: cleanUsername,
          wpm: numWpm,
          rawWpm: numRaw,
          accuracy: numAcc,
          consistency: numConsistency,
          mode: mode,
          mode2: numMode2,
          language: language,
          timestamp: Date.now(),
          isFinalized: true
        };

        await lbCol.updateOne(
          {
            username: cleanUsername,
            mode,
            mode2: numMode2,
            language
          },
          { $set: lbEntry },
          { upsert: true, collation: { locale: 'en', strength: 2 } }
        );

        console.log(`[Vercel Serverless /api/session] Finalized session for @${cleanUsername}: ${numWpm} WPM -> Ranked #${newRank} in ${mode} ${mode2}`);
      }

      return res.status(200).json({
        success: true,
        message: `Session for "${cleanUsername}" finalized and submitted to MongoDB Atlas!`,
        username: cleanUsername,
        bestWpm: numWpm
      });
    }

    return res.status(400).json({ success: false, error: 'Invalid action' });
  } catch (error) {
    console.error('[Vercel Serverless Error /api/session]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}
