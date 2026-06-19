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
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || 'OAuth exchange failed');
  return data.access_token;
}

// ── Get GitHub user info from token ─────────────────────────────────────────
async function getGithubUser(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  return res.json();
}

// ── List user's repos (owned + collab, not forks) ───────────────────────────
async function listRepos(token) {
  const res = await fetch(
    'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner',
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
  );
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

// ── Fetch single repo metadata for AI context ────────────────────────────────
async function fetchRepoMeta(token, fullName) {
  const res = await fetch(`https://api.github.com/repos/${fullName}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
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

// ── Add buyer as collaborator ────────────────────────────────────────────────
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
      body: JSON.stringify({ permission: 'pull' }), // read-only access
    }
  );
  // 201 = invited, 204 = already a collaborator
  return res.status === 201 || res.status === 204;
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS for same-domain fetch from frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const mode = req.query.mode || req.body?.mode;

  try {

    // ── mode=callback: OAuth code → token → repos → save to Firebase ─────────
    if (mode === 'callback') {
      if (req.method !== 'POST') return res.status(405).end();
      const { code, uid } = req.body;
      if (!code || !uid) return res.status(400).json({ error: 'Missing code or uid' });

      const token = await exchangeCodeForToken(code);
      const ghUser = await getGithubUser(token);
      const repos  = await listRepos(token);

      // Save token + username to Firebase (token encrypted at rest by Firebase)
      await db().ref(`users/${uid}/github`).set({
        username:     ghUser.login,
        avatarUrl:    ghUser.avatar_url,
        accessToken:  token,   // stored server-side only, never sent to client
        linkedAt:     Date.now(),
      });

      // Return repos + username to frontend (no token)
      return res.status(200).json({
        username: ghUser.login,
        avatar:   ghUser.avatar_url,
        repos,
      });
    }

    // ── mode=repos: return seller's repo list ────────────────────────────────
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

    // ── mode=repodata: fetch live repo metadata for AI ───────────────────────
    if (mode === 'repodata') {
      if (req.method !== 'POST') return res.status(405).end();
      const { uid, fullName } = req.body;
      if (!uid || !fullName) return res.status(400).json({ error: 'Missing uid or fullName' });

      const snap = await db().ref(`users/${uid}/github`).get();
      if (!snap.exists()) return res.status(404).json({ error: 'GitHub not connected' });
      const { accessToken } = snap.val();
      const meta = await fetchRepoMeta(accessToken, fullName);

      // Also cache it in Firebase so AI can read it without hitting GitHub every time
      await db().ref(`users/${uid}/autoSell/repoMeta`).set({ ...meta, cachedAt: Date.now() });

      return res.status(200).json({ repo: meta });
    }

    // ── mode=invite: add buyer as collaborator after payment ─────────────────
    if (mode === 'invite') {
      if (req.method !== 'POST') return res.status(405).end();
      const { sellerUid, buyerGithubUsername, repoFullName } = req.body;
      if (!sellerUid || !buyerGithubUsername || !repoFullName) {
        return res.status(400).json({ error: 'Missing sellerUid, buyerGithubUsername, or repoFullName' });
      }

      // Load seller token from Firebase
      const snap = await db().ref(`users/${sellerUid}/github`).get();
      if (!snap.exists()) return res.status(404).json({ error: 'Seller GitHub not connected' });
      const { accessToken } = snap.val();

      const ok = await addCollaborator(accessToken, repoFullName, buyerGithubUsername);
      if (!ok) return res.status(500).json({ error: 'Failed to add collaborator' });

      // Log the invite in Firebase
      await db().ref(`autosell/${sellerUid}/invites`).push({
        buyerGithubUsername,
        repoFullName,
        invitedAt: Date.now(),
      });

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `Unknown mode: ${mode}` });

  } catch (err) {
    console.error('[github-autosell]', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
