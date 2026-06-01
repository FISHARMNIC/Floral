# Daisy Language Syntax Highlighting

A clean, minimal VSCode extension for syntax highlighting of the Daisy programming language.

## Features

- **Syntax Highlighting** for `.flower` files
- **Smart Indentation** - automatic indentation for control structures
- **Bracket Matching** - automatic bracket pairing and matching
- **Comment Support** - both single-line (`//`) and multi-line (`/* */`) comments
- **Semantic Tokens** for:
  - Keywords: `function`, `let`, `if`, `elif`, `while`, `spawn`, `await`, `break`, etc.
  - Built-in Functions: `send()`, `recieve()`, `print()`
  - Types: `None`, `bool`, `int`, `string`, `float`, `list`, `dict`
  - Constants: `true`, `false`
  - Strings, numbers, operators, and punctuation

## Installation

### From Source (Development)

1. Clone this repository
2. Open the extension folder in VSCode
3. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to open the Run and Debug view
4. Click "Run Extension" to launch a development VSCode window with the extension loaded

### Package as VSIX

```bash
npm install -g vsce
vsce package
```

Then install the generated `.vsix` file in VSCode via the Extensions sidebar.

## Usage

Simply open any `.flower` file, and syntax highlighting will be applied automatically.

## Colors

The extension uses VSCode's default theme colors. Common theme mappings:

- **Keywords** - blue
- **Strings** - red/orange
- **Numbers** - green
- **Comments** - gray
- **Functions** - blue/cyan
- **Types** - light blue
- **Constants** - blue/purple

## Development

Edit `syntaxes/daisy.tmLanguage.json` to modify syntax rules.

For testing:
1. Make changes to the grammar
2. Press `Ctrl+Shift+P` and reload the extension window
3. Open a `.flower` file to see your changes

## License

MIT
