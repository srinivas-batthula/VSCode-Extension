import * as vscode from 'vscode';
import { getHelloPanelHtml } from '../panels/helloPanel';
import { log } from '../utils/logger';

export function registerHelloWorld(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand(
        'helloWorldExtension.helloWorld',
        () => {
            const panel = vscode.window.createWebviewPanel(
                'helloWorld',
                'Hello Panel',
                vscode.ViewColumn.One,
                {}
            );
            panel.webview.html = getHelloPanelHtml();
            log('Opened Hello Panel');
        }
    );
    context.subscriptions.push(command);
}
