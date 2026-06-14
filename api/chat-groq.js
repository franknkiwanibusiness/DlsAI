// api/chat-groq.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Method execution disallowed." });

    const { message, systemPrompt, repo } = req.body;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // Define the structural framework for Llama's automated tool execution
    const tools = [{
        type: "function",
        function: {
            name: "push_files_to_github",
            description: "Pushes or updates isolated code blocks (index.html, style.css, app.js) straight to the user's GitHub repository.",
            parameters: {
                type: "object",
                properties: {
                    htmlContent: { type: "string", description: "The full structure of the updated HTML code." },
                    cssContent: { type: "string", description: "The full text layout of the updated CSS code." },
                    jsContent: { type: "string", description: "The complete implementation string of the JavaScript logic." }
                },
                required: ["htmlContent"]
            }
        }
    }];

    try {
        // Fire request to Groq Engine
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                tools: tools,
                tool_choice: "auto"
            })
        });

        const data = await groqResponse.json();
        const choice = data.choices[0];

        // Process active tool execution calls if Llama decides to push updates
        if (choice.message.tool_calls) {
            const toolCall = choice.message.tool_calls[0];
            const args = JSON.parse(toolCall.function.arguments);
            let syncLogs = [];

            // Helper function to commit files synchronously to GitHub
            async function commitToGit(path, rawText) {
                const targetUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
                let currentSha = "";
                
                // Read current version to prevent merge conflicts
                const checkRes = await fetch(targetUrl, { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` } });
                if (checkRes.ok) {
                    const gitData = await checkRes.json();
                    currentSha = gitData.sha;
                }

                // Convert text to standard Base64 compilation array
                const b64Payload = Buffer.from(unescape(encodeURIComponent(rawText))).toString('base64');
                
                await fetch(targetUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "AI Auto-Generation Pipeline Commit", content: b64Payload, sha: currentSha || undefined })
                });
                syncLogs.push(`📁 **${path}** successfully written to GitHub.`);
            }

            // Fire sequential pushes for individual blocks compiled by the AI
            if (args.htmlContent) await commitToGit('index.html', args.htmlContent);
            if (args.cssContent) await commitToGit('style.css', args.cssContent);
            if (args.jsContent) await commitToGit('app.js', args.jsContent);

            return res.status(200).json({ 
                aiResponse: `🤖 **AI Status:** I have analyzed your request, rewrote the code architecture, and synced your repository files automatically!\n\n${syncLogs.join('\n')}`,
                updatedFiles: { html: args.htmlContent, css: args.cssContent || "", js: args.jsContent || "" }
            });
        }

        // Default to returning regular chat text if no file updates were requested
        return res.status(200).json({ aiResponse: choice.message.content });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
