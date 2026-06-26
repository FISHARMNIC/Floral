const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// --- Run File Command ---

function registerRunFileCommand(context) {
    const disposable = vscode.commands.registerCommand('floral.runFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active Floral file.');
            return;
        }
        const filePath = editor.document.uri.fsPath;
        let terminal = vscode.window.terminals.find(t => t.name === 'Floral');
        if (!terminal) {
            terminal = vscode.window.createTerminal('Floral');
        }
        terminal.show(true);
        terminal.sendText(`bud "${filePath}" --run`);
    });
    context.subscriptions.push(disposable);
}

// --- Bconfig Scripts Tree View ---

class ScriptItem extends vscode.TreeItem {
    constructor(scriptName, scriptCommand, configFilePath) {
        super(scriptName, vscode.TreeItemCollapsibleState.None);
        this.scriptName = scriptName;
        this.scriptCommand = scriptCommand;
        this.configFilePath = configFilePath;
        this.tooltip = scriptCommand;
        this.description = scriptCommand;
        this.iconPath = new vscode.ThemeIcon('play');
        this.command = {
            command: 'floral.runScript',
            title: 'Run Script',
            arguments: [this]
        };
        this.contextValue = 'floralScript';
    }
}

class ConfigFileItem extends vscode.TreeItem {
    constructor(label, configFilePath, scripts) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        this.configFilePath = configFilePath;
        this.scripts = scripts;
        this.iconPath = new vscode.ThemeIcon('json');
        this.contextValue = 'floralConfigFile';
    }
}

class BconfigTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (element instanceof ConfigFileItem) {
            return Object.entries(element.scripts).map(
                ([name, cmd]) => new ScriptItem(name, cmd, element.configFilePath)
            );
        }

        const folders = vscode.workspace.workspaceFolders;
        if (!folders) return [];

        const items = [];
        for (const folder of folders) {
            const bconfigFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(folder, '**/*.bconfig')
            );

            for (const fileUri of bconfigFiles) {
                try {
                    const raw = fs.readFileSync(fileUri.fsPath, 'utf8');
                    const parsed = JSON.parse(raw);
                    const scripts = parsed.scripts || {};
                    if (Object.keys(scripts).length === 0) continue;
                    const label = path.relative(folder.uri.fsPath, fileUri.fsPath);
                    items.push(new ConfigFileItem(label, fileUri.fsPath, scripts));
                } catch {
                    // skip malformed files
                }
            }
        }
        return items;
    }
}

function registerBconfigView(context) {
    const provider = new BconfigTreeProvider();

    const view = vscode.window.createTreeView('floralScripts', {
        treeDataProvider: provider,
        showCollapseAll: true
    });

    const watcher = vscode.workspace.createFileSystemWatcher('**/*.bconfig');
    watcher.onDidChange(() => provider.refresh());
    watcher.onDidCreate(() => provider.refresh());
    watcher.onDidDelete(() => provider.refresh());

    const runScript = vscode.commands.registerCommand('floral.runScript', (item) => {
        if (!(item instanceof ScriptItem)) return;
        const cwd = path.dirname(item.configFilePath);

        const existing = vscode.window.terminals.find(t => t.name === 'Bconfig');
        if (existing) existing.dispose();

        let writeEmitter = new vscode.EventEmitter();
        let closeEmitter = new vscode.EventEmitter();
        let done = false;

        const pty = {
            onDidWrite: writeEmitter.event,
            onDidClose: closeEmitter.event,
            open() {},
            close() {},
            handleInput() {
                if (done) closeEmitter.fire();
            },
        };

        const terminal = vscode.window.createTerminal({ name: 'Bconfig', pty });
        terminal.show(true);

        const write = data => writeEmitter.fire(data.replace(/\n/g, '\r\n'));

        const proc = spawn(item.scriptCommand, [], {
            cwd,
            shell: true,
            env: process.env,
        });

        proc.stdout.on('data', d => write(d.toString()));
        proc.stderr.on('data', d => write(d.toString()));
        proc.on('close', code => {
            write(`\r\n\x1b[90m============================\r\nProcess exited with code \x1b[33m${code}\x1b[0m\r\n`);
            write(`\x1b[90m============================\r\n\nPress any key to close...\x1b[0m\r\n`);
            done = true;
        });
    });

    const refreshCmd = vscode.commands.registerCommand('floral.refreshScripts', () => {
        provider.refresh();
    });

    context.subscriptions.push(view, watcher, runScript, refreshCmd);
}

// --- Activate ---

function activate(context) {
    registerRunFileCommand(context);
    registerBconfigView(context);
}

function deactivate() {}

module.exports = { activate, deactivate };
