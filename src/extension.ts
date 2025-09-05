// src/extension.ts
import * as vscode from 'vscode';
import { registerHelloWorld } from './commands/helloWorld';
import { registerSearchAndJumpCommand } from './commands/searchAndJump';
import { registerShowSearchHistory } from './commands/showSearchHistory';


export function activate(context: vscode.ExtensionContext) {
    registerHelloWorld(context);
    registerSearchAndJumpCommand(context);
    registerShowSearchHistory(context);
};

export function deactivate() { };
