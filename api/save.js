// Remove: import fetch from 'node-fetch';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Mohamork';
const REPO_NAME = 'Aktivitetlogg';
const FILE_PATH = 'log.txt';
const BRANCH = 'main';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST allowed');
  }

  try {
    // Manually parse body (because Vercel may not parse automatically)
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      console.error('JSON parse error:', e);
      return res.status(400).send('Invalid JSON');
    }

    const note = parsed.note;
    if (!note) {
      return res.status(400).send('Missing note');
    }

    const timestamp = new Date().toISOString();
    const newLine = `[${timestamp}] ${note}\n`;

    const fileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    };

    // Use native fetch (no import needed)
    const fileResp = await fetch(fileUrl, { headers });

    if (!fileResp.ok) {
      const err = await fileResp.text();
      console.error('GitHub GET error:', err);
      return res.status(500).send('Failed to fetch log.txt');
    }

    const fileData = await fileResp.json();

    const contentDecoded = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const updatedContent = contentDecoded + newLine;
    const updatedBase64 = Buffer.from(updatedContent).toString('base64');

    const commitResp = await fetch(fileUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Add note at ${timestamp}`,
        content: updatedBase64,
        sha: fileData.sha,
        branch: BRANCH,
      }),
    });

    if (!commitResp.ok) {
      const err = await commitResp.text();
      console.error('GitHub PUT error:', err);
      return res.status(500).send('Failed to update log.txt');
    }

    return res.status(200).send('Note saved to GitHub.');
  } catch (err) {
    console.error('Unhandled server error:', err);
    return res.status(500).send('Server error occurred');
  }
}
