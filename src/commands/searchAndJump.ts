import * as vscode from 'vscode';
import * as path from 'path';

export function registerSearchAndJumpCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'helloWorldExtension.searchAndJump',
        async () => {
            // Ask for search term
            const searchText = await vscode.window.showInputBox({
                prompt: 'Enter the text or pattern to search...',
                ignoreFocusOut: true,
            });
            if (!searchText) return;

            // File type filters
            const fileTypes = ['.*', '.ts', '.js', '.java', '.py', '.cpp', '.c', '.json', '.txt', '.md'];
            const selectedType = await vscode.window.showQuickPick(fileTypes, {
                placeHolder: 'Select file type to search in (e.g., .java)',
                canPickMany: false,
            });

            if (!selectedType) return;

            // Build glob include pattern
            const includePattern =
                selectedType === '*' ? '**/*' : `**/*${selectedType}`;

            const uris = await vscode.workspace.findFiles(includePattern);

            if (uris.length === 0) {
                vscode.window.showInformationMessage(`No files found with extension " ${selectedType} "!`);
                return;
            }

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

                        // Highlight match using Markdown-style preview (bold match)
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
                vscode.window.showInformationMessage(`No matches found for " ${searchText} "!`);
                return;
            }

            // Show results in QuickPick with Markdown hover preview
            const selected = await vscode.window.showQuickPick(
                results.map((r) => ({
                    label: r.label,
                    description: r.description,
                    detail: r.preview, // Markdown-style diff preview
                    uri: r.uri,
                    range: r.range,
                })),
                {
                    placeHolder: `Found ${results.length} matches for "${searchText}"`,
                    matchOnDetail: true,
                }
            );

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