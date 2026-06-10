// api/code.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method validation failed' });
    }

    const { command, fileContent, fileName } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment config missing on server context.' });
    }

    // Leveraging the 1M+ Token Flash architecture
    const targetModel = "gemini-2.5-flash"; 
    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const instructions = `You are a precision engineering AI. You are provided with the file "${fileName}" containing extensive context codebase layers. 
Execute the user directive thoroughly and accurately, modifying or producing optimized programmatic structural text updates as requested.`;

    const requestPayload = {
        contents: [{
            parts: [
                { text: instructions },
                { text: `=== TARGET DATA FIELD: ${fileName} ===\n${fileContent}\n=== END FIELD CONTEXT ===` },
                { text: `DIRECTIVE COMMAND: ${command}` }
            ]
        }]
    };

    try {
        const streamRequest = await fetch(endpointUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        });

        const parsedJson = await streamRequest.json();

        if (!streamRequest.ok) {
            return res.status(streamRequest.status).json({ error: parsedJson.error?.message || 'Gemini Target Error' });
        }

        const resolvedText = parsedJson.candidates?.[0]?.content?.parts?.[0]?.text || "Empty response body returned.";
        return res.status(200).json({ response: resolvedText });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
