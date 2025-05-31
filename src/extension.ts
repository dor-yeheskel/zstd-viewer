import * as vscode from 'vscode';
import { getTmpFile } from './decompress';

async function openDecoded(uri?: vscode.Uri) {
  if (!uri) {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri;
    const pick = await vscode.window.showOpenDialog({
      title: 'Select a .zst file',
      defaultUri: root,
      canSelectMany: false,
      filters: { 'Zstandard files': ['zst'] }
    });
    if (!pick) return;
    uri = pick[0];
  }

  if (!uri.fsPath.endsWith('.zst')) {
    return vscode.window.showErrorMessage('Not a .zst file');
  }

  try {
    const tmpPath = await getTmpFile(uri);
    const doc     = await vscode.workspace.openTextDocument(tmpPath);
    await vscode.window.showTextDocument(doc, { preview: false });
  } catch (e) {
    vscode.window.showErrorMessage(`ZST Viewer: ${(e as Error).message}`);
  }
}

export function activate(ctx: vscode.ExtensionContext): void {
  ctx.subscriptions.push(
    vscode.commands.registerCommand('zstViewer.openDecoded',      openDecoded),
    vscode.commands.registerCommand('zstViewer.openDecodedCtx',   openDecoded)
  );
}

export function deactivate() {}
