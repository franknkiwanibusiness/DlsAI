// api/github-autosell.js — Siterifty AutoSell GitHub Integration

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// ── GitHub OAuth Credentials ──────────────────────────────────────────────────
// Client ID is hardcoded (public)
const GITHUB_CLIENT_ID = 'Iv23li02xb3bQ14ZvMeR';

// ── Get the OAuth Client Secret from environment ────────────────────────────
function getClientSecret() {
  // The OAuth secret is stored in GITHUB_SECRET_KEY (NOT GITHUB_PRIVATE_KEY)
  const secret = process.env.GITHUB_SECRET_KEY;
  if (!secret || secret.length === 0) {
    console.error('[GitHub OAuth] ❌ GITHUB_SECRET_KEY is not set or empty.');
    throw new Error('GitHub OAuth Client Secret missing. Set GITHUB_SECRET_KEY with your 40-character secret.');
  }
  console.log(`[GitHub OAuth] ✅ Using GITHUB_SECRET_KEY (length: ${secret.length})`);
  if (secret.length !== 40) {
    console.warn(`[GitHub OAuth] ⚠️ Secret length is ${secret.length}, expected 40. Check your value.`);
  }
  return secret;
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

  const requestBody = {
    client_id:     GITHUB_CLIENT_ID,
    client_secret: clientSecret,
    code,
  };

  if (process.env.GITHUB_REDIRECT_URI) {
    requestBody.redirect_uri = process.env.GITHUB_REDIRECT_URI;
    console.log('[GitHub OAuth] 📡 Redirect URI:', process.env.GITHUB_REDIRECT_URI);
  }

  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    console.log('[GitHub OAuth] 📨 GitHub response:', JSON.stringify(data, null, 2));

    if (data.error) {
      let msg = data.error_description || data.error;
      if (data.error === 'bad_verification_code') {
        msg = 'The authorization code expired or was already used. Try again with a fresh code.';
      } else if (data.error === 'incorrect_client_credentials') {
        msg = 'Invalid Client ID or Secret. Check that GITHUB_SECRET_KEY contains the correct 40‑character secret.';
      } else if (data.error === 'redirect_uri_mismatch') {
        msg = 'Redirect URI mismatch. Update your GitHub App settings.';
      }
      throw new Error(msg);
    }

    if (!data.access_token) {
      throw new Error('No access_token in response: ' + JSON.stringify(data));
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
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`GitHub API error (${res.status}): ${error}`);
    }
    return res.json();
  } catch (error) {
    console.error('[GitHub OAuth] ❌ Failed to get user info:', error.message);
    throw error;
  }
}

// ── List user's repositories (owned) ──────────────────────────────────────────
async function listRepos(token) {
  try {
    const res = await fetch(
      'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`GitHub API error (${res.status}): ${error}`);
    }
    const repos = await res.json();
    if (!Array.isArray(repos)) throw new Error('Invalid repos response');

    return repos.map((r) => ({
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
    throw error;
  }
}

// ── Fetch single repo metadata ──────────────────────────────────────────────
async function fetchRepoMeta(token, fullName) {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`GitHub API error (${res.status}): ${error}`);
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
    throw error;
  }
}

// ── Add buyer as collaborator (read‑only access) ────────────────────────────
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
        body: JSON.stringify({ permission: 'pull' }),
      }
    );
    const success = res.status === 201 || res.status === 204;
    if (!success) {
      const error = await res.text();
      throw new Error(`GitHub API error (${res.status}): ${error || 'Failed to add collaborator'}`);
    }
    return true;
  } catch (error) {
    console.error('[GitHub OAuth] ❌ Failed to add collaborator:', error.message);
    throw error;
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const mode = req.query.mode || req.body?.mode;
  console.log('[GitHub OAuth] 📡 Mode:', mode);

  try {
    if (mode === 'callback') {
      if (req.method !== 'POST') return res.status(405).end();

      const { code, uid } = req.body;
      if (!code) return res.status(400).json({ error: 'Missing code parameter' });
      if (!uid) return res.status(400).json({ error: 'Missing uid parameter' });

      console.log('[GitHub OAuth] 📝 Callback for UID:', uid);

      const token = await exchangeCodeForToken(code);
      const ghUser = await getGithubUser(token);
      const repos = await listRepos(token);

      await db().ref(`users/${uid}/github`).set({
        username:     ghUser.login,
        avatarUrl:    ghUser.avatar_url,
        accessToken:  token,
        linkedAt:     Date.now(),
      });

      console.log('[GitHub OAuth] ✅ Connection successful for', ghUser.login);
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

      await db().ref(`users/${uid}/autoSell/repoMeta`).set({
        ...meta,
        cachedAt: Date.now(),
      });

      return res.status(200).json({ repo: meta });
    }

    if (mode === 'invite') {
      if (req.method !== 'POST') return res.status(405).end();

      const { sellerUid, buyerGithubUsername, repoFullName } = req.body;
      if (!sellerUid || !buyerGithubUsername || !repoFullName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      console.log('[GitHub OAuth] 👥 Adding collaborator:', {
        sellerUid,
        buyer: buyerGithubUsername,
        repo: repoFullName,
      });

      const snap = await db().ref(`users/${sellerUid}/github`).get();
      if (!snap.exists()) return res.status(404).json({ error: 'Seller GitHub not connected' });

      const { accessToken } = snap.val();
      await addCollaborator(accessToken, repoFullName, buyerGithubUsername);

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
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}