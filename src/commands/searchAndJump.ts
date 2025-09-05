// src/commands/searchAndJump.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { addSearchToHistory } from '../utils/history';

/**
 * Registers the "Search & Jump" command
 * Optimized for performance using VSCode's built-in file indexing
 */
export function registerSearchAndJumpCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'jumpSearchExtension.searchAndJump',
        async (providedTerm?: string) => {
            // Step 1: Prompt for search term
            const searchText = providedTerm ?? await vscode.window.showInputBox({
                prompt: 'Enter the text or pattern to search...',
                ignoreFocusOut: true,
                value: providedTerm || '',  // Pre-fill if provided (when called directly from Search-History)...
            });
            if (!searchText) return;

            // Step 2: Ensure a workspace is open
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showWarningMessage("No workspace is open!");
                return;
            }

            // Step 3: Select folders (allows searching in only specific folders)
            const selectedFolders = await vscode.window.showQuickPick(
                workspaceFolders.map(f => f.name),
                {
                    placeHolder: "Select folders to search in",
                    canPickMany: true,
                }
            );
            if (!selectedFolders || selectedFolders.length === 0) return;

            // Step 4: Select file type filter
            const fileTypes = ['.*', '.ts', '.js', '.java', '.py', '.cpp', '.c', '.json', '.txt', '.md'];
            const selectedType = await vscode.window.showQuickPick(fileTypes, {
                placeHolder: 'Select file type (.* for all files)',
            });
            if (!selectedType) return;

            // Step 5: Save search term in persistent history
            addSearchToHistory(context, searchText);

            // Step 6: Build glob pattern for files
            const includePattern = selectedType === '.*' ? '**/*' : `**/*${selectedType}`;
            const selectedFolderUris = workspaceFolders.filter(f => selectedFolders.includes(f.name));

            // Step 7: Fetch matching files using VSCode's indexed search
            const uris: vscode.Uri[] = [];
            for (const folder of selectedFolderUris) {
                const folderUris = await vscode.workspace.findFiles(
                    new vscode.RelativePattern(folder, includePattern),
                    '**/node_modules/**' // Exclude node_modules for speed
                );
                uris.push(...folderUris);
            }

            if (uris.length === 0) {
                vscode.window.showWarningMessage(`No files found in selected folders with extension ${selectedType}`);
                return;
            }

            // Step 8: Search inside files asynchronously with progress bar
            const results = await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `Searching for "${searchText}"...`,
                    cancellable: true,
                },
                async (progress, token) => {
                    const matches: {
                        label: string;
                        description: string;
                        detail: string;
                        uri: vscode.Uri;
                        range: vscode.Range;
                        preview: string;
                    }[] = [];

                    const regex = new RegExp(searchText, 'gi');

                    for (let i = 0; i < uris.length; i++) {
                        if (token.isCancellationRequested) break;

                        const uri = uris[i];
                        progress.report({
                            message: `Scanning ${path.basename(uri.fsPath)} (${i + 1}/${uris.length})`,
                            increment: (i / uris.length) * 100,
                        });

                        const doc = await vscode.workspace.openTextDocument(uri);
                        const text = doc.getText();
                        let match: RegExpExecArray | null;

                        // Search line by line to get exact positions
                        for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
                            const lineText = doc.lineAt(lineNum).text;
                            while ((match = regex.exec(lineText)) !== null) {
                                const start = new vscode.Position(lineNum, match.index);
                                const end = new vscode.Position(lineNum, match.index + match[0].length);
                                const range = new vscode.Range(start, end);

                                matches.push({
                                    label: `${match[0]} → ${path.relative(vscode.workspace.rootPath || '', uri.fsPath)}:${lineNum + 1}`,
                                    description: `Line ${lineNum + 1}`,
                                    detail: lineText.trim(),
                                    uri,
                                    range,
                                    preview: lineText.replace(new RegExp(searchText, 'gi'), (m) => `**${m}**`),
                                });
                            }
                        }
                    }
                    return matches;
                }
            );

            if (!results || results.length === 0) {
                vscode.window.showInformationMessage(`No matches found for "${searchText}"`);
                return;
            }

            // Step 9: Show results in QuickPick
            const selected = await vscode.window.showQuickPick(
                results.map((r) => ({
                    label: r.label,
                    description: r.description,
                    detail: r.preview,
                    uri: r.uri,
                    range: r.range,
                })),
                {
                    placeHolder: `Found ${results.length} matches for "${searchText}"`,
                    matchOnDetail: true,
                }
            );

            // Step 10: Jump to selected match in editor
            if (selected) {
                const doc = await vscode.workspace.openTextDocument(selected.uri);
                const editor = await vscode.window.showTextDocument(doc);
                editor.selection = new vscode.Selection(selected.range.start, selected.range.end);
                editor.revealRange(selected.range, vscode.TextEditorRevealType.InCenter);
            }
        }
    );

    context.subscriptions.push(disposable);
}
