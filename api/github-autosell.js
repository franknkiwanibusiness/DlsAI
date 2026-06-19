// api/github-autosell.js — Siterifty AutoSell GitHub Integration

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// ── GitHub OAuth Credentials ──────────────────────────────────────────────────
// Client ID is hardcoded (public)
const GITHUB_CLIENT_ID = 'Iv23li02xb3bQ14ZvMeR';

// We'll read the secret from GITHUB_PRIVATE_KEY (as you have it set)
// Also fallback to GITHUB_CLIENT_SECRET for compatibility
function getClientSecret() {
  // First try your environment variable
  let secret = process.env.GITHUB_PRIVATE_KEY;
  if (secret) {
    console.log('[GitHub OAuth] Using client secret from GITHUB_PRIVATE_KEY');
    return secret;
  }
  
  // Fallback to standard name
  secret = process.env.GITHUB_CLIENT_SECRET;
  if (secret) {
    console.log('[GitHub OAuth] Using client secret from GITHUB_CLIENT_SECRET');
    return secret;
  }
  
  console.error('[GitHub OAuth] ❌ No client secret found in environment!');
  throw new Error('GitHub Client Secret not set. Please set GITHUB_PRIVATE_KEY or GITHUB_CLIENT_SECRET environment variable.');
}

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
  console.log('[GitHub OAuth] 🔑 Exchanging code...');
  console.log('[GitHub OAuth] 📝 Code prefix:', code.substring(0, 10) + '...');
  console.log('[GitHub OAuth] 🆔 Client ID (hardcoded):', GITHUB_CLIENT_ID);

  const clientSecret = getClientSecret();
  console.log('[GitHub OAuth] 🔒 Client Secret:', clientSecret ? '✅ Present' : '❌ Missing');

  const requestBody = {
    client_id:     GITHUB_CLIENT_ID,
    client_secret: clientSecret,
    code,
  };

  // Optional redirect_uri (helps with mismatch)
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
    console.log('[GitHub OAuth] 📨 GitHub response:', JSON.stringify(data, null, 2));

    if (data.error) {
      let msg = data.error_description || data.error;
      if (data.error === 'bad_verification_code') msg = 'The code expired or was used already. Try again.';
      else if (data.error === 'incorrect_client_credentials') msg = 'Invalid Client ID or Secret. Check your GITHUB_PRIVATE_KEY value.';
      else if (data.error === 'redirect_uri_mismatch') msg = 'Redirect URI mismatch. Update GitHub App settings.';
      throw new Error(msg);
    }

    if (!data.access_token) {
      throw new Error('No access token returned. Response: ' + JSON.stringify(data));
    }

    console.log('[GitHub OAuth] ✅ Token obtained');
    return data.access_token;
  } catch (error) {
    console.error('[GitHub OAuth] ❌ Exchange failed:', error.message);
    throw error;
  }
}

// ── Get GitHub user info ──────────────────────────────────────────────────────
async function getGithubUser(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

// ── List user's repos ────────────────────────────────────────────────────────
async function listRepos(token) {
  const res = await fetch(
    'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner',
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
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
}

// ── Fetch single repo metadata ──────────────────────────────────────────────
async function fetchRepoMeta(token, fullName) {
  const res = await fetch(`https://api.github.com/repos/${fullName}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
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
}

// ── Add buyer as collaborator ──────────────────────────────────────────────
async function addCollaborator(sellerToken, fullName, buyerGithubUsername) {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/collaborators/${buyerGithubUsername}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${sellerToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permission: 'pull' }),
    }
  );
  return res.status === 201 || res.status === 204;
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const mode = req.query.mode || req.body?.mode;

  try {
    if (mode === 'callback') {
      if (req.method !== 'POST') return res.status(405).end();
      const { code, uid } = req.body;
      if (!code || !uid) return res.status(400).json({ error: 'Missing code or uid' });

      const token = await exchangeCodeForToken(code);
      const ghUser = await getGithubUser(token);
      const repos = await listRepos(token);

      await db().ref(`users/${uid}/github`).set({
        username:     ghUser.login,
        avatarUrl:    ghUser.avatar_url,
        accessToken:  token,
        linkedAt:     Date.now(),
      });

      return res.status(200).json({
        username: ghUser.login,
        avatar:   ghUser.avatar_url,
        repos,
        success: true,
      });
    }

    if (mode === 'repos') {
      if (req.method !== 'POST') return res.status(405).end();
      const { uid } = req.body;
      if (!uid) return res.status(400).json({ error: 'Missing uid' });

      const snap = await db().ref(`users/${uid}/github`).get();
      if (!snap.exists()) return res.status(404).json({ error: 'GitHub not connected' });
      const { accessToken } = snap.val();
      const repos = await listRepos(accessToken);
      return res.status(200).json({ repos });
    }

    if (mode === 'repodata') {
      if (req.method !== 'POST') return res.status(405).end();
      const { uid, fullName } = req.body;
      if (!uid || !fullName) return res.status(400).json({ error: 'Missing uid or fullName' });

      const snap = await db().ref(`users/${uid}/github`).get();
      if (!snap.exists()) return res.status(404).json({ error: 'GitHub not connected' });
      const { accessToken } = snap.val();
      const meta = await fetchRepoMeta(accessToken, fullName);

      await db().ref(`users/${uid}/autoSell/repoMeta`).set({ ...meta, cachedAt: Date.now() });
      return res.status(200).json({ repo: meta });
    }

    if (mode === 'invite') {
      if (req.method !== 'POST') return res.status(405).end();
      const { sellerUid, buyerGithubUsername, repoFullName } = req.body;
      if (!sellerUid || !buyerGithubUsername || !repoFullName) {
        return res.status(400).json({ error: 'Missing fields' });
      }

      const snap = await db().ref(`users/${sellerUid}/github`).get();
      if (!snap.exists()) return res.status(404).json({ error: 'Seller GitHub not connected' });
      const { accessToken } = snap.val();

      const ok = await addCollaborator(accessToken, repoFullName, buyerGithubUsername);
      if (!ok) return res.status(500).json({ error: 'Failed to add collaborator' });

      await db().ref(`autosell/${sellerUid}/invites`).push({
        buyerGithubUsername,
        repoFullName,
        invitedAt: Date.now(),
        status: 'invited',
      });

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `Unknown mode: ${mode}` });
  } catch (err) {
    console.error('[GitHub OAuth] ❌ Error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}