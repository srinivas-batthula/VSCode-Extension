import * as vscode from 'vscode';

export function registerShowInfo(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand(
        'helloWorldExtension.showInfo',
        () => {
            vscode.window.showInformationMessage('VSCode API is cool!');
        }
    );

    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(info) Info';
    statusBar.command = 'helloWorldExtension.showInfo';
    statusBar.show();

    context.subscriptions.push(command, statusBar);
}
