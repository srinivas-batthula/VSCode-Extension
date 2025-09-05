import * as vscode from 'vscode';
import { getSearchHistory } from '../utils/history';
import { getSearchHistoryHtml } from '../panels/searchHistoryPanel';
import { addSearchToHistory } from '../utils/history';

export function registerShowSearchHistory(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'jumpSearchExtension.showSearchHistory',
        () => {
            const history = getSearchHistory(context);
            const panel = vscode.window.createWebviewPanel(
                'searchHistory',
                'Search History',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            panel.webview.html = getSearchHistoryHtml(history);

            panel.webview.onDidReceiveMessage(
                message => {
                    if (message.command === 'searchAndJump') {
                        addSearchToHistory(context, message.term);
                        vscode.commands.executeCommand('jumpSearchExtension.searchAndJump', message.term);
                    }
                },
                undefined,
                context.subscriptions
            );
        }
    );

    context.subscriptions.push(disposable);
}
