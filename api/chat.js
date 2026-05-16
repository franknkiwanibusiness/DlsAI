import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

// Initialize Firebase with your environment tokens
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messageHistory } = req.body;

    // Turn 1: Call Google's official API using your GEMINI_API_KEY to hit Gemma 27B
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messageHistory,
          systemInstruction: {
            parts: [{ text: "You are the automated chat agent for MINIMISTY. You help customers look up FrostBlade Pro orders. If information isn't found or unrelated, politely ask them to email official store support." }]
          }
        })
      }
    );

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ error: "Google API returned an empty tracking payload." });
    }

    const replyText = data.candidates[0].content.parts[0].text;

    // Scan the user's input for an email or order target string to trigger the Firebase check
    const lastUserMessage = messageHistory[messageHistory.length - 1]?.content || "";
    if (lastUserMessage.includes("@") || lastUserMessage.match(/#\d+/)) {
      
      const targetKey = lastUserMessage.replace(/[.#$\[\]]/g, "_").trim();
      const orderRef = ref(db, `orders/${targetKey}`);
      const snapshot = await get(orderRef);

      if (snapshot.exists()) {
        // Turn 2: Inject the live order object data back into Gemma 27B for a clean summary
        const followUpResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                ...messageHistory,
                { role: "model", parts: [{ text: replyText }] },
                { 
                  role: "user", 
                  parts: [{ text: `System Database Update: Found order details: ${JSON.stringify(snapshot.val())}. Summarize this tracking state cleanly to the customer.` }] 
                }
              ]
            })
          }
        );

        const finalData = await followUpResponse.json();
        return res.status(200).json({ reply: finalData.candidates[0].content.parts[0].text });
      }
    }

    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Gemma API Handler Error:", error);
    return res.status(500).json({ error: "Internal backend bridge malfunction." });
  }
}
