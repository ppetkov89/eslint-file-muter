# eslint-file-muter

`eslint-file-muter` is a CLI tool that helps developers mute ESLint rules directly within JavaScript files. This tool will append `eslint-disable` with all active eslint errors on top of your file.

## Features

- **CLI Simplicity**: Easy-to-use command line interface.
- **Project-Wide Application**: Apply changes across your entire project or specified directories.
- **Customizable Patterns**: Target files using glob patterns.

## Installation

Install `eslint-file-muter` using npm:

```bash
npm install eslint-file-muter
```

Or run it directly using npx (no installation required):

```bash
npx eslint-file-muter <directory> [options]
```

## Usage

After installation, run `eslint-file-muter` by specifying the directory and optional parameters:

```bash
eslint-file-muter /path/to/your/project --pattern '**/*.js'
```

### Options

- `--pattern` (alias `-p`): Glob pattern to match files (default: `'**/*.js'`).
- `--prefix` (alias `-x`): Prefix comment to show on top of eslint comments (default: `TODO: Fix later.`).
- `--concurrency` (alias `-c`): Number of files to process concurrently (default: 10).
- `--verbose` (alias `-v`): Enable verbose logging.

## Example

Mute ESLint rules in all JavaScript files in the `src` directory:

```bash
eslint-file-muter src --pattern '**/*.js' --verbose --prefix 'Eslint errors'.
```
