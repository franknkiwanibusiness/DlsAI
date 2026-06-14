// api/edit-file.js
export default async function handler(req, res) {
    // Enable CORS handling
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const token = process.env.GITHUB_TOKEN; 
    const { repo, path, content, sha } = req.method === 'GET' ? req.query : req.body;

    if (!repo || !path) {
        return res.status(400).json({ error: "Missing required tracking parameters: repo or path." });
    }

    const url = `https://api.github.com/repos/${repo}/contents/${path}`;

    try {
        // GET METHOD: Fetches file configuration and SHA from GitHub
        if (req.method === 'GET') {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                return res.status(response.status).json({ error: "File not found or connection failed." });
            }
            
            const data = await response.json();
            return res.status(200).json(data);
        } 
        
        // PUT METHOD: Commits updated code variations directly to GitHub
        if (req.method === 'PUT') {
            const bodyData = {
                message: "Production Pipeline Update",
                content: content, // Base64 payload from frontend
                sha: sha || undefined
            };

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyData)
            });

            const data = await response.json();
            return res.status(200).json(data);
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
