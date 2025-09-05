// src/panels/searchHistoryPanel.ts

export function getSearchHistoryHtml(history: string[]): string {
    const items = history.length > 0
        ? history
            .map(
                term => `
                <li>
                    <a href="#" class="search-link">${term}</a>
                </li>`
            )
            .join('')
        : '<p class="empty">No searches yet.</p>';

        // OnClick on any item Sends a Msg (from 'script') to re-start the 'search' with the current item...
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Search History</title>
        <style>
            :root {
                --bg: #1e1e1e;
                --card-bg: #252526;
                --text: #f3f3f3;
                --accent: #4ea1ff;
                --accent-hover: #69b6ff;
                --border: #3a3a3a;
                --empty-text: #999;
            }
            body {
                font-family: 'Segoe UI', Tahoma, sans-serif;
                background: var(--bg);
                color: var(--text);
                padding: 1.5rem;
                margin: 0;
            }
            h1 {
                font-size: 1.5rem;
                margin-bottom: 1rem;
                color: var(--accent);
                text-align: center;
            }
            .history-container {
                background: var(--card-bg);
                border: 1px solid var(--border);
                border-radius: 10px;
                padding: 1rem 1.5rem;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                margin: auto;
            }
            ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            li {
                margin: 0.5rem 0;
                border-bottom: 1px solid var(--border);
                padding-bottom: 0.4rem;
            }
            li:last-child {
                border-bottom: none;
            }
            a.search-link {
                text-decoration: none;
                color: var(--accent);
                font-size: 1rem;
                display: block;
                padding: 0.3rem 0.5rem;
                border-radius: 6px;
                transition: background 0.2s, color 0.2s;
            }
            a.search-link:hover {
                background: rgba(78, 161, 255, 0.1);
                color: var(--accent-hover);
            }
            .empty {
                color: var(--empty-text);
                font-style: italic;
                text-align: center;
                padding: 1rem;
            }
        </style>
    </head>
    <body>
        <div class="history-container">
            <h1>🔍 Recent Searches</h1>
            <ul>${items}</ul>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            document.querySelectorAll('.search-link').forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    vscode.postMessage({
                        command: 'searchAndJump',
                        term: link.textContent
                    });
                });
            });
        </script>
    </body>
    </html>
    `;
}
