import * as vscode from 'vscode';
import { getSearchHistory } from '../utils/history';
import { getSearchHistoryHtml } from '../panels/searchHistoryPanel';
import { addSearchToHistory } from '../utils/history';


export function registerShowSearchHistory(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'jumpSearchExtension.showSearchHistory',    // register cmd
        () => {
            const history = getSearchHistory(context);      // fetch history from `globalState`
            const panel = vscode.window.createWebviewPanel(
                'searchHistory',
                'Search History',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            panel.webview.html = getSearchHistoryHtml(history);     // Display history in a WebView (separate html-page)...

            panel.webview.onDidReceiveMessage(      // Listen for the 'events' from the WebView-page's `<script>...</script>` via 'postMessage()'...
                message => {
                    if (message.command === 'searchAndJump') {
                        addSearchToHistory(context, message.term);      // When user clicks on any item in the history, it triggers the searchAndJump-cmd again with the same item...
                        vscode.commands.executeCommand('jumpSearchExtension.searchAndJump', message.term);
                    }
                },
                undefined,
                context.subscriptions
            );
        }
    );

    context.subscriptions.push(disposable);     // Auto Clean-Up when the Extension is De-Activated...
}
