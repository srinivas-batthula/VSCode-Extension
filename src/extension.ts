import * as vscode from 'vscode';
import { registerHelloWorld } from './commands/helloWorld';
import { registerShowInfo } from './commands/showInfo';
import { registerSearchAndJumpCommand } from './commands/searchAndJump';


export function activate(context: vscode.ExtensionContext) {
    registerHelloWorld(context);
    registerShowInfo(context);
    registerSearchAndJumpCommand(context);
};

export function deactivate() { };
