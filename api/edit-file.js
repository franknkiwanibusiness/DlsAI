// api/edit-file.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const token = process.env.GITHUB_TOKEN; 
    
    // NEW FEATURE: Intercept request to list user repositories automatically
    if (req.method === 'GET' && req.query.fetchRepos === 'true') {
        try {
            // Fetch list sorted by most recently updated projects
            const repoListRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!repoListRes.ok) return res.status(repoListRes.status).json({ error: "Could not pull repository directories." });
            
            const data = await repoListRes.json();
            // Filter out just the clean name info data needed for dropdown rendering
            const cleanRepos = data.map(r => ({ name: r.name, full_name: r.full_name }));
            return res.status(200).json(cleanRepos);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    const { repo, path, content, sha } = req.method === 'GET' ? req.query : req.body;

    if (!repo || !path) {
        return res.status(400).json({ error: "Missing required parameters: repo or path." });
    }

    const url = `https://api.github.com/repos/${repo}/contents/${path}`;

    try {
        if (req.method === 'GET') {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return res.status(response.status).json({ error: "File tracking data absent." });
            
            const data = await response.json();
            return res.status(200).json(data);
        } 
        
        if (req.method === 'PUT') {
            const bodyData = {
                message: "Production Pipeline Update",
                content: content,
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
