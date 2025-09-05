// src/utils/history.ts
import * as vscode from 'vscode';

const HISTORY_KEY = 'searchHistory';
const MAX_HISTORY = 20;

export function addSearchToHistory(context: vscode.ExtensionContext, term: string) {
    const history = context.globalState.get<string[]>(HISTORY_KEY, []);
    // Remove duplicate & push to top
    const newHistory = [term, ...history.filter(h => h !== term)].slice(0, MAX_HISTORY);
    context.globalState.update(HISTORY_KEY, newHistory);
}

export function getSearchHistory(context: vscode.ExtensionContext): string[] {
    return context.globalState.get<string[]>(HISTORY_KEY, []);
}
