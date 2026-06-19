// api/github-autosell.js — Siterifty AutoSell GitHub Integration
// Handles:
//   POST ?mode=callback   — OAuth code exchange, fetch repos, save token to Firebase
//   GET  ?mode=repos      — Return seller's repos (uses stored token)
//   POST ?mode=invite     — Add buyer as collaborator after payment
//   POST ?mode=repodata   — Fetch live repo metadata for AI context

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// ── Firebase init ────────────────────────────────────────────────────────────
function initFirebase() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

function db() {
  initFirebase();
  return getDatabase();
}

// ── Exchange OAuth code for user access token ────────────────────────────────
async function exchangeCodeForToken(code) {
  console.log('[GitHub OAuth] 🔑 Exchanging code for token...');
  console.log('[GitHub OAuth] 📝 Code (first 10 chars):', code.substring(0, 10) + '...');
  console.log('[GitHub OAuth] 🆔 Client ID configured:', !!process.env.GITHUB_CLIENT_ID);
  console.log('[GitHub OAuth] 🔒 Client Secret configured:', !!process.env.GITHUB_CLIENT_SECRET);
  
  // Validate required env vars
  if (!process.env.GITHUB_CLIENT_ID) {
    throw new Error('GITHUB_CLIENT_ID is not configured in environment variables');
  }
  if (!process.env.GITHUB_CLIENT_SECRET) {
    throw new Error('GITHUB_CLIENT_SECRET is not configured in environment variables');
  }

  const requestBody = {
    client_id:     process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
  };

  // Add redirect_uri if configured (helps with mismatch errors)
  if (process.env.GITHUB_REDIRECT_URI) {
    requestBody.redirect_uri = process.env.GITHUB_REDIRECT_URI;
    console.log('[GitHub OAuth] 📡 Redirect URI:', process.env.GITHUB_REDIRECT_URI);
  }

  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    console.log('[GitHub OAuth] 📨 GitHub Response:', JSON.stringify(data, null, 2));

    // Check for error response
    if (data.error) {
      console.error('[GitHub OAuth] ❌ Error from GitHub:', data.error);
      console.error('[GitHub OAuth] 📝 Description:', data.error_description);
      
      // Provide helpful error messages
      let errorMessage = data.error_description || data.error;
      
      if (data.error === 'bad_verification_code') {
        errorMessage = 'The authorization code has expired or was already used. Please try the GitHub login again.';
      } else if (data.error === 'incorrect_client_credentials') {
        errorMessage = 'The GitHub Client ID or Secret is incorrect. Please check your environment variables.';
      } else if (data.error === 'redirect_uri_mismatch') {
        errorMessage = 'The redirect URI does not match your GitHub App settings. Please update the GitHub App configuration.';
      } else if (data.error === 'invalid_code') {
        errorMessage = 'Invalid authorization code. Please try the GitHub login again.';
      }
      
      throw new Error(errorMessage);
    }

    if (!data.access_token) {
      console.error('[GitHub OAuth] ❌ No access_token in response:', data);
      throw new Error('GitHub did not return an access token. Response: ' + JSON.stringify(data));
    }

    console.log('[GitHub OAuth] ✅ Success! Token obtained');
    return data.access_token;
    
  } catch (error) {
    console.error('[GitHub OAuth] ❌ Exchange failed:', error.message);
    throw error;
  }
}

// ── Get GitHub user info from token ─────────────────────────────────────────
async function getGithubUser(token) {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${token}`, 
        Accept: 'application/vnd.github+json' 
      },
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`GitHub API error: ${res.status} - ${error}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('[GitHub OAuth] ❌ Failed to get user info:', error.message);
    throw new Error('Failed to fetch GitHub user info: ' + error.message);
  }
}

// ── List user's repos (owned + collab, not forks) ───────────────────────────
async function listRepos(token) {
  try {
    const res = await fetch(
      'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner',
      { 
        headers: { 
          Authorization: `Bearer ${token}`, 
          Accept: 'application/vnd.github+json' 
        } 
      }
    );
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`GitHub API error: ${res.status} - ${error}`);
    }
    
    const repos = await res.json();
    if (!Array.isArray(repos)) throw new Error('Failed to fetch repos');
    
    return repos.map(r => ({
      id:          r.id,
      name:        r.name,
      full_name:   r.full_name,
      description: r.description || '',
      private:     r.private,
      url:         r.html_url,
      stars:       r.stargazers_count,
      language:    r.language || '',
      topics:      r.topics || [],
      size:        r.size,
      updated_at:  r.updated_at,
    }));
  } catch (error) {
    console.error('[GitHub OAuth] ❌ Failed to list repos:', error.message);
    throw new Error('Failed to list GitHub repos: ' + error.message);
  }
}

// ── Fetch single repo metadata for AI context ────────────────────────────────
async function fetchRepoMeta(token, fullName) {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: { 
        Authorization: `Bearer ${token}`, 
        Accept: 'application/vnd.github+json' 
      },
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`GitHub API error: ${res.status} - ${error}`);
    }
    
    const r = await res.json();
    return {
      name:        r.name,
      full_name:   r.full_name,
      description: r.description || '',
      private:     r.private,
      url:         r.html_url,
      stars:       r.stargazers_count,
      forks:       r.forks_count,
      language:    r.language || '',
      topics:      r.topics || [],
      size:        r.size,
      created_at:  r.created_at,
      updated_at:  r.updated_at,
      license:     r.license?.name || null,
      open_issues: r.open_issues_count,
    };
  } catch (error) {
    console.error('[GitHub OAuth] ❌ Failed to fetch repo metadata:', error.message);
    throw new Error('Failed to fetch repo metadata: ' + error.message);
  }
}

// ── Add buyer as collaborator ────────────────────────────────────────────────
async function addCollaborator(sellerToken, fullName, buyerGithubUsername) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${fullName}/collaborators/${buyerGithubUsername}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sellerToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permission: 'pull' }), // read-only access
      }
    );
    
    // 201 = invited, 204 = already a collaborator
    const success = res.status === 201 || res.status === 204;
    
    if (!success) {
      const error = await res.text();
      console.error('[GitHub OAuth] ❌ Failed to add collaborator:', res.status, error);
      throw new Error(`GitHub API error: ${res.status} - ${error || 'Failed to add collaborator'}`);
    }
    
    return true;
  } catch (error) {
    console.error('[GitHub OAuth] ❌ Failed to add collaborator:', error.message);
    throw new Error('Failed to add collaborator: ' + error.message);
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS for same-domain fetch from frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const mode = req.query.mode || req.body?.mode;
  console.log('[GitHub OAuth] 📡 Mode:', mode);

  try {
    // ── mode=callback: OAuth code → token → repos → save to Firebase ─────────
    if (mode === 'callback') {
      if (req.method !== 'POST') return res.status(405).end();
      
      const { code, uid } = req.body;
      console.log('[GitHub OAuth] 📝 Callback received for UID:', uid);
      
      if (!code) {
        console.error('[GitHub OAuth] ❌ Missing code parameter');
        return res.status(400).json({ error: 'Missing code parameter' });
      }
      if (!uid) {
        console.error('[GitHub OAuth] ❌ Missing uid parameter');
        return res.status(400).json({ error: 'Missing uid parameter' });
      }

      // Exchange code for token
      console.log('[GitHub OAuth] 🔄 Exchanging code...');
      const token = await exchangeCodeForToken(code);
      
      // Get user info
      console.log('[GitHub OAuth] 👤 Fetching user info...');
      const ghUser = await getGithubUser(token);
      
      // List repos
      console.log('[GitHub OAuth] 📂 Listing repos...');
      const repos = await listRepos(token);

      // Save token + username to Firebase (token encrypted at rest by Firebase)
      console.log('[GitHub OAuth] 💾 Saving to Firebase...');
      await db().ref(`users/${uid}/github`).set({
        username:     ghUser.login,
        avatarUrl:    ghUser.avatar_url,
        accessToken:  token,   // stored server-side only, never sent to client
        linkedAt:     Date.now(),
      });

      // Return repos + username to frontend (no token)
      console.log('[GitHub OAuth] ✅ Success! Returning user data');
      return res.status(200).json({
        username: ghUser.login,
        avatar:   ghUser.avatar_url,
        repos,
        success: true,
      });
    }

    // ── mode=repos: return seller's repo list ────────────────────────────────
    if (mode === 'repos') {
      if (req.method !== 'POST') return res.status(405).end();
      
      const { uid } = req.body;
      if (!uid) return res.status(400).json({ error: 'Missing uid' });

      console.log('[GitHub OAuth] 📂 Fetching repos for UID:', uid);
      
      const snap = await db().ref(`users/${uid}/github`).get();
      if (!snap.exists()) {
        console.error('[GitHub OAuth] ❌ GitHub not connected for user');
        return res.status(404).json({ error: 'GitHub not connected' });
      }
      
      const { accessToken } = snap.val();
      const repos = await listRepos(accessToken);
      
      console.log('[GitHub OAuth] ✅ Found', repos.length, 'repos');
      return res.status(200).json({ repos });
    }

    // ── mode=repodata: fetch live repo metadata for AI ───────────────────────
    if (mode === 'repodata') {
      if (req.method !== 'POST') return res.status(405).end();
      
      const { uid, fullName } = req.body;
      if (!uid || !fullName) {
        return res.status(400).json({ error: 'Missing uid or fullName' });
      }

      console.log('[GitHub OAuth] 📊 Fetching repo data for:', fullName);
      
      const snap = await db().ref(`users/${uid}/github`).get();
      if (!snap.exists()) {
        console.error('[GitHub OAuth] ❌ GitHub not connected for user');
        return res.status(404).json({ error: 'GitHub not connected' });
      }
      
      const { accessToken } = snap.val();
      const meta = await fetchRepoMeta(accessToken, fullName);

      // Also cache it in Firebase so AI can read it without hitting GitHub every time
      await db().ref(`users/${uid}/autoSell/repoMeta`).set({ 
        ...meta, 
        cachedAt: Date.now() 
      });

      console.log('[GitHub OAuth] ✅ Repo data cached');
      return res.status(200).json({ repo: meta });
    }

    // ── mode=invite: add buyer as collaborator after payment ─────────────────
    if (mode === 'invite') {
      if (req.method !== 'POST') return res.status(405).end();
      
      const { sellerUid, buyerGithubUsername, repoFullName } = req.body;
      
      if (!sellerUid || !buyerGithubUsername || !repoFullName) {
        return res.status(400).json({ 
          error: 'Missing sellerUid, buyerGithubUsername, or repoFullName' 
        });
      }

      console.log('[GitHub OAuth] 👥 Adding collaborator:', {
        sellerUid,
        buyer: buyerGithubUsername,
        repo: repoFullName
      });

      // Load seller token from Firebase
      const snap = await db().ref(`users/${sellerUid}/github`).get();
      if (!snap.exists()) {
        console.error('[GitHub OAuth] ❌ Seller GitHub not connected');
        return res.status(404).json({ error: 'Seller GitHub not connected' });
      }
      
      const { accessToken } = snap.val();

      const ok = await addCollaborator(accessToken, repoFullName, buyerGithubUsername);
      if (!ok) {
        return res.status(500).json({ error: 'Failed to add collaborator' });
      }

      // Log the invite in Firebase
      await db().ref(`autosell/${sellerUid}/invites`).push({
        buyerGithubUsername,
        repoFullName,
        invitedAt: Date.now(),
        status: 'invited',
      });

      console.log('[GitHub OAuth] ✅ Collaborator added successfully');
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `Unknown mode: ${mode}` });

  } catch (err) {
    console.error('[GitHub OAuth] ❌ Fatal error:', err);
    
    // Send a clean error message to the client
    const errorMessage = err.message || 'Internal server error';
    return res.status(500).json({ 
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}