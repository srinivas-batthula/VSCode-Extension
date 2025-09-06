// src/commands/searchAndJump.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { addSearchToHistory } from '../utils/history';

/**
 * Registers the "Search & Jump" command into VSCode's command-palette.
 * Search is optimized for performance using VSCode's built-in file indexing.
 */
export function registerSearchAndJumpCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'jumpSearchExtension.searchAndJump',     // cmd shown in cmd-palette
        async (providedTerm?: string) => {
            // Prompt input to enter Search Term...
            const searchText = providedTerm ?? await vscode.window.showInputBox({
                prompt: 'Enter the text or pattern to search...',
                ignoreFocusOut: true,
                value: providedTerm || '',  // Pre-fill if provided (`providedTerm` is provided when called directly from Search-History)...
            });
            if (!searchText) return;

            // Ensure a workspace is open...
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showWarningMessage("No workspace is open!");
                return;
            }

            // --- Dynamically collect folder & subfolder paths only (excluding files) ---
            async function collectAllFolders(folder: vscode.WorkspaceFolder): Promise<string[]> {
                const files = await vscode.workspace.findFiles(
                    new vscode.RelativePattern(folder, '**/*'),
                    '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/.next/**,**/.vercel/**,**/.turbo/**,**/coverage/**,**/.angular/**,**/.nx/**,**/build/**,**/bower_components/**,**/tmp/**,**/temp/**,**/.tmp/**,**/.cache/**,**/__pycache__/**,**/.venv/**,**/venv/**,**/.idea/**,**/.vscode/**,**/.DS_Store}',
                    500
                );

                const folderPaths = new Set<string>();
                folderPaths.add(folder.name); // Add root folder

                for (const fileUri of files) {
                    const rel = path.relative(folder.uri.fsPath, path.dirname(fileUri.fsPath)); // Get folder path
                    if (rel && rel.length > 0 && !rel.startsWith('.')) {
                        const fullFolderPath = path.join(folder.name, rel);
                        folderPaths.add(fullFolderPath);    // Add subfolders
                    }
                }

                return Array.from(folderPaths).sort();
            }

            const folderOptions: string[] = [];
            for (const f of workspaceFolders) {         // collect subfolders at each folder level
                const folders = await collectAllFolders(f);
                folderOptions.push(...folders);
            }

            // Prompt user to pick from folders/subfolders
            const selectedFolders = await vscode.window.showQuickPick(
                folderOptions,
                {
                    placeHolder: "Select folders to search in (root and/or subfolders only)",
                    canPickMany: true,
                }
            );
            if (!selectedFolders || selectedFolders.length === 0) return;

            // Prompt user to Select file-type filter
            const fileTypes = [
                '.*', '.ts', '.tsx', '.js', '.jsx', '.java', '.py', '.cpp', '.c', '.h', '.hpp',
                '.json', '.yaml', '.yml', '.txt', '.md', '.html', '.css', '.scss', '.go', '.rs',
                '.sh', '.env', '.ini', '.xml'
            ];
            const selectedType = await vscode.window.showQuickPick(fileTypes, {
                placeHolder: 'Select file type (.* for all files)',
            });
            if (!selectedType) return;

            // Save search-term in persistent history (globalState)
            addSearchToHistory(context, searchText);

            // Build glob pattern for files...
            const includePattern = selectedType === '.*' ? '**/*' : `**/*${selectedType}`;

            // Map selected folder names to actual URIs...
            const selectedUris = selectedFolders.map(sel => {
                const matchRoot = workspaceFolders.find(wf => sel === wf.name || sel.startsWith(wf.name + path.sep));
                if (matchRoot) {
                    if (sel === matchRoot.name) {
                        return matchRoot.uri;
                    }
                    const relPath = sel.substring(matchRoot.name.length + 1);
                    return vscode.Uri.joinPath(matchRoot.uri, relPath);
                }
                return undefined;
            }).filter((u): u is vscode.Uri => !!u);

            const uris: vscode.Uri[] = [];
            for (const folderUri of selectedUris) {
                const folderUris = await vscode.workspace.findFiles(
                    new vscode.RelativePattern(folderUri, includePattern),
                    '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/.next/**,**/.vercel/**,**/.turbo/**,**/coverage/**,**/.angular/**,**/.nx/**,**/build/**,**/bower_components/**,**/tmp/**,**/temp/**,**/.tmp/**,**/.cache/**,**/__pycache__/**,**/.venv/**,**/venv/**,**/.idea/**,**/.vscode/**,**/.DS_Store}'
                );
                uris.push(...folderUris);
            }

            if (uris.length === 0) {
                vscode.window.showWarningMessage(`No files found in selected folders with extension ${selectedType}`);
                return;
            }

            // Search inside files line-by-line asynchronously with progress bar...
            const MAX_RESULTS_FETCH = 600, MAX_RESULTS_DISPLAY = 100;
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

                    // Traversing through each file...
                    for (let i = 0; i < uris.length; i++) {
                        if (token.isCancellationRequested || matches.length >= MAX_RESULTS_FETCH) break;

                        const uri = uris[i];
                        progress.report({
                            message: `Scanning ${path.basename(uri.fsPath)} (${i + 1}/${uris.length})`,
                            increment: (i / uris.length) * 100,
                        });

                        const doc = await vscode.workspace.openTextDocument(uri);   // Open file...
                        for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {     // Traverse through each line's in all files...
                            const lineText = doc.lineAt(lineNum).text;
                            let match: RegExpExecArray | null;
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
                                if (matches.length >= MAX_RESULTS_FETCH) break;
                            }
                            if (matches.length >= MAX_RESULTS_FETCH) break;
                        }
                    }
                    return matches.slice(0, MAX_RESULTS_DISPLAY);
                }
            );

            if (!results || results.length === 0) {
                vscode.window.showInformationMessage(`No matches found for "${searchText}"`);
                return;
            }

            // Show results in QuickPick (command-palette)
            const selected = await vscode.window.showQuickPick(
                results.map((r) => ({
                    label: r.label,
                    description: r.description,
                    detail: r.preview,
                    uri: r.uri,
                    range: r.range,
                })),
                {
                    placeHolder: `Found '${results.length}' matches for "${searchText}"  (Results are Only Shown upto ${MAX_RESULTS_DISPLAY})`,
                    matchOnDetail: true,
                }
            );

            // Jump to selected match in editor, onClick on any item displayed in the QuickPick view...
            if (selected) {
                const doc = await vscode.workspace.openTextDocument(selected.uri);
                const editor = await vscode.window.showTextDocument(doc);
                editor.selection = new vscode.Selection(selected.range.start, selected.range.end);
                editor.revealRange(selected.range, vscode.TextEditorRevealType.InCenter);
            }
        }
    );

    context.subscriptions.push(disposable);     // Auto Clean-Up when the Extension is De-Activated...
}
