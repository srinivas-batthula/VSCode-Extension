// src/extension.ts
import * as vscode from 'vscode';
import { registerHelloWorld } from './commands/helloWorld';
import { registerSearchAndJumpCommand } from './commands/searchAndJump';
import { registerShowSearchHistory } from './commands/showSearchHistory';

// Central place to register all commands...
// This `extension.ts` is called to activate / deactivate the extension...
export function activate(context: vscode.ExtensionContext) {
    registerHelloWorld(context);
    registerSearchAndJumpCommand(context);
    registerShowSearchHistory(context);
};

export function deactivate() { };
