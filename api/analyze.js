import { GoogleGenerativeAI } from "@google/generative-ai";

// We removed all the Firebase Admin code entirely!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "No image provided" });

    try {
        // Gemma 3 12B - High limit, no Firebase needed
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });
        
        const prompt = "Analyze this DLS squad. Extract player names and ratings. Return ONLY a JSON array like this: [{\"n\": \"Mbappe\", \"r\": 98}]";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
        ]);

        const text = result.response.text();
        const match = text.match(/\[.*\]/s); // Find the JSON array in the text
        
        if (!match) throw new Error("AI couldn't find player data in that image.");
        
        const players = JSON.parse(match[0]);

        // Instead of saving to a database, we just send the data back to the frontend
        res.status(200).json({ 
            success: true, 
            players: players, // This sends the actual player list back
            playersFound: players.length 
        });

    } catch (error) {
        console.error("AI Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}
