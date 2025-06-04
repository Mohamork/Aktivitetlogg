import { writeFile, appendFile } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { note } = req.body;
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${note}\n`;

  const filePath = join(process.cwd(), 'log.txt');

  try {
    await appendFile(filePath, line, 'utf8');
    res.status(200).send('Note saved successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to save note.');
  }
}
