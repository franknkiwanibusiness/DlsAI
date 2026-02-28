import axios from 'axios';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton pattern to prevent multiple initializations)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Important: Vercel env vars sometimes strip newline characters from private keys
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com` 
  });
}

const db = admin.database();

export default async function handler(req, res) {
  const ODDS_KEY = process.env.ODDS_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  try {
    // 1. Fetch Odds
    const oddsRes = await axios.get('https://api.the-odds-api.com/v4/sports/soccer_epl/odds/', {
      params: { apiKey: ODDS_KEY, regions: 'uk', markets: 'totals', oddsFormat: 'decimal' }
    });

    const game = oddsRes.data[0];
    if (!game) return res.status(404).json({ message: "No games found" });

    // 2. Get AI Predictions (Groq & Gemini)
    const prompt = `Analyze ${game.home_team} vs ${game.away_team} for Over/Under goals. Data: ${JSON.stringify(game.bookmakers[0]?.markets[0])}. Give a 1-sentence prediction.`;
    
    const groq = new Groq({ apiKey: GROQ_KEY });
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const [groqRes, geminiRes] = await Promise.all([
      groq.chat.completions.create({ messages: [{ role: 'user', content: prompt }], model: 'llama3-8b-8192' }),
      geminiModel.generateContent(prompt)
    ]);

    const predictionData = {
      match: `${game.home_team} vs ${game.away_team}`,
      time: new Date().toISOString(),
      groq: groqRes.choices[0].message.content,
      gemini: geminiRes.response.text(),
      actual_result: "pending" // We'll update this later
    };

    // 3. SAVE TO FIREBASE REALTIME DATABASE
    const newPredictionRef = db.ref('predictions').push();
    await newPredictionRef.set(predictionData);

    return res.status(200).json({
      id: newPredictionRef.key,
      ...predictionData
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
