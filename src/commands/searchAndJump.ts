// src/commands/searchAndJump.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { addSearchToHistory } from '../utils/history';


export function registerSearchAndJumpCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'jumpSearchExtension.searchAndJump',
        async (providedTerm?: string) => {
            // 1. Ask for search term
            const searchText = providedTerm ?? await vscode.window.showInputBox({
                prompt: 'Enter the text or pattern to search...',
                ignoreFocusOut: true,
                value: providedTerm || '', // Pre-fill if provided (when called directly from Search-History)...
            });
            if (!searchText) return;

            // 2. Ask user to choose folders
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showWarningMessage("No workspace is open!");
                return;
            }

            const selectedFolders = await vscode.window.showQuickPick(
                workspaceFolders.map(f => f.name),
                {
                    placeHolder: "Select folders to search in (e.g., src/)",
                    canPickMany: true,
                }
            );
            if (!selectedFolders || selectedFolders.length === 0) return;

            // 3. Ask for file type
            const fileTypes = ['.*', '.ts', '.js', '.java', '.py', '.cpp', '.c', '.json', '.txt', '.md'];
            const selectedType = await vscode.window.showQuickPick(fileTypes, {
                placeHolder: 'Select file type to search in (e.g., .java)',
                canPickMany: false,
            });
            if (!selectedType) return;

            // Save search term to Global State...
            addSearchToHistory(context, searchText);

            // 4. Prepare glob pattern
            const includePattern = selectedType === '.*' ? '**/*' : `**/*${selectedType}`;
            const selectedFolderUris = workspaceFolders.filter(f => selectedFolders.includes(f.name));

            const uris: vscode.Uri[] = [];
            for (const folder of selectedFolderUris) {
                const folderUris = await vscode.workspace.findFiles(
                    new vscode.RelativePattern(folder, includePattern)
                );
                uris.push(...folderUris);
            }

            if (uris.length === 0) {
                vscode.window.showWarningMessage(`No files found in selected folders " ${selectedFolders} " with extension " ${selectedType} "`);
                return;
            }

            // 5. Perform search
            const results: {
                label: string;
                description: string;
                detail: string;
                uri: vscode.Uri;
                range: vscode.Range;
                preview: string;
            }[] = [];

            const regex = new RegExp(searchText, 'gi');

            for (const uri of uris) {
                const doc = await vscode.workspace.openTextDocument(uri);
                for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
                    const lineText = doc.lineAt(lineNum).text;
                    let match: RegExpExecArray | null;
                    while ((match = regex.exec(lineText)) !== null) {
                        const start = new vscode.Position(lineNum, match.index);
                        const end = new vscode.Position(lineNum, match.index + match[0].length);
                        const range = new vscode.Range(start, end);

                        const preview = lineText.replace(
                            new RegExp(searchText, 'gi'),
                            (m) => `**${m}**`
                        );

                        results.push({
                            label: `${match[0]} → ${path.relative(vscode.workspace.rootPath || '', uri.fsPath)}:${lineNum + 1}`,
                            description: `Line ${lineNum + 1}`,
                            detail: lineText.trim(),
                            uri,
                            range,
                            preview,
                        });
                    }
                }
            }

            if (results.length === 0) {
                vscode.window.showInformationMessage(`No matches found for " ${searchText} "`);
                return;
            }

            // 6. Show QuickPick results
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

            // 7. Jump to the file/location of the selected item...
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
