import * as vscode from 'vscode';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { decompress } from 'fzstd';
import { createHash } from 'crypto';

const USER_DIR   = `zst-viewer-of-${os.userInfo().username}`;
const BASE_DIR   = path.join(os.tmpdir(), USER_DIR);
const INDEX_FILE = path.join(BASE_DIR, '.index.json');

const MAX_SIZE = 500 * 1024 * 1024;            // ask if >500 MB after decompress

interface Index { [key: string]: string; }
let index: Index = {};

/* ---------- index helpers ---------- */
async function loadIndex() {
  try { index = JSON.parse(await fs.readFile(INDEX_FILE, 'utf8')); }
  catch { index = {}; }
}
async function saveIndex() {
  await fs.writeFile(INDEX_FILE, JSON.stringify(index), 'utf8');
}

/* ---------- key = path|size|mtime|ino ---------- */
function makeKey(stat: any, src: string) {
  return createHash('sha256')
    .update(`${src}|${stat.size}|${stat.mtimeMs}|${stat.ino ?? 0}`)
    .digest('hex');
}

/* ---------- main API ---------- */
export async function getTmpFile(zstUri: vscode.Uri): Promise<string> {
  await fs.mkdir(BASE_DIR, { recursive: true });
  await loadIndex();

  const st  = await fs.stat(zstUri.fsPath);
  const key = makeKey(st, zstUri.fsPath);
  const baseName = path.basename(zstUri.fsPath, '.zst');   // e.g. bla.log

  /* reuse existing tmp if unchanged */
  if (key in index && await fs.stat(index[key]).catch(() => false)) {
    return index[key];
  }

  /* unique filename for this session */
  let counter = 0;
  let out: string;
  do {
    const prefix = counter === 0 ? '' : `${counter.toString().padStart(5, '0')}_`;
    out = path.join(BASE_DIR, `${prefix}${baseName}`);
    counter++;
  } while (await fs.access(out).then(() => true).catch(() => false));

  /* decompress */
  const raw  = await fs.readFile(zstUri.fsPath);
  const data = decompress(new Uint8Array(raw));

  if (data.length > MAX_SIZE) {
    const ans = await vscode.window.showWarningMessage(
      `Decompressed size ${(data.length / 1e6).toFixed(1)} MB. Open anyway?`,
      { modal: true }, 'Open', 'Cancel'
    );
    if (ans !== 'Open') throw new Error('Cancelled by user');
  }

  await fs.writeFile(out, Buffer.from(data), { mode: 0o444 });

  index[key] = out;
  await saveIndex();

  return out;
}
