# JumpSearch

🚀 A simple yet powerful VS Code extension that lets you **search, View, and jump** to any text in your workspace — with a built-in **search history panel**.

![JumpSearch Screenshot](src/assets/image.png)

---

## ✨ Features

- 🔍 **Search Across Workspace**: Search for any text or RegExp pattern in your project files.
- 🗂️ **Folder & File Type Filtering**: Choose specific folders and file types (`src/`, `.java`, etc.).
- ⚡ **Quick Navigation**: Jump directly to a match with one click.
- 📝 **Search History**: View and re-run your last 30 searches from a Webview panel.

---

## 📦 Commands

| Command ID                              | Title                                  | Description                                 |
| --------------------------------------- | -------------------------------------- | ------------------------------------------- |
| `jumpSearchExtension.helloWorld`        | Hello World Panel                      | Opens a sample webview panel (demo).        |
| `jumpSearchExtension.searchAndJump`     | Search & Navigate to Text in Workspace | Search workspace text and jump to matches.  |
| `jumpSearchExtension.showSearchHistory` | Show Search History                    | View and re-run recent searches in a panel. |

---

## ⚙️ Installation

Search for `JumpSearch` Extension in the **VS Code Marketplace** and click **Install**.

OR

### Install directly

- [Install from MarketPlace](https://marketplace.visualstudio.com/items?itemName=srinivas-batthula.jump-search)
- [Hub URL](https://marketplace.visualstudio.com/manage/publishers/srinivas-batthula/extensions/jump-search/hub)

OR

### Install manually

```bash
code --install-extension jump-search-1.0.0.vsix
```

---

## Usage Instructions

1. In VSCode, Open Command-Palette (Ctrl + Shift + P)
2. Enter commands like `Search & Navigate to Text in Workspace`...
3. To view all commands, Enter `JumpSearch`...

---

## 🔁 Workflow (End-to-End)

1. User presses Ctrl+Shift+P → Search & Navigate to Text.
2. Extension asks for (via Command-Palette QuickPick):
   - Search term
   - Folder(s)
   - File type
3. It finds files via vscode.workspace.findFiles().
4. Opens each file, runs a regex search.
5. Displays results in a dropdown.
6. User selects a match → VSCode jumps to that file & highlights the term.
7. Search term is saved to persistent history.
8. Clicking Show Search History shows a webview UI with previous searches.
9. Clicking on any of the search-term will again starts the search command with that term

---

