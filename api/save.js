// Vercel function: /api/save.js

import fetch from 'node-fetch';

const GITHUB_TOKEN = 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;
const REPO_OWNER = 'Mohamork';
const REPO_NAME = 'Aktivitetlogg';
const FILE_PATH = 'log.txt';
const BRANCH = 'main';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST allowed');
  }

  const { note } = req.body;
  const timestamp = new Date().toISOString();
  const newLine = `[${timestamp}] ${note}\n`;

  // Get current file SHA and content
  const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  };

  try {
    const fileResp = await fetch(getUrl, { headers });
    const fileData = await fileResp.json();

    const contentDecoded = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const updatedContent = contentDecoded + newLine;
    const updatedBase64 = Buffer.from(updatedContent).toString('base64');

    const commitResp = await fetch(getUrl, {
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
      return res.status(500).send('GitHub commit failed: ' + err);
    }

    return res.status(200).send('Note saved to GitHub.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving note.');
  }
}
