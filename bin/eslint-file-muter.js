#!/usr/bin/env node

const Promise = require('bluebird');
const { glob } = require('glob');
const path = require('path');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs/promises');

async function readEslintIgnore(verbose) {
  try {
    const eslintIgnore = await fs.readFile('.eslintignore', 'utf8');
    return eslintIgnore.split('\n').filter((line) => line.trim() !== '' && !line.startsWith('#'));
  } catch (err) {
    if (verbose) {
      console.log('No .eslintignore file found.');
    }
    return [];
  }
}

async function getESLintInstance(config) {
  const cwd = process.cwd();

  try {
    const { ESLint } = require(path.join(cwd, 'node_modules', 'eslint'));
    return new ESLint(config);
  } catch (error) {
    console.log(error);
    console.error("Could not find 'eslint' in the current project. Please ensure it is installed.");
    process.exit(1);
  }
}

async function createESLintTool(config) {
  const eslint = await getESLintInstance({
    useEslintrc: true, // Use the ESLint configuration in the current project
  });

  const ignorePatterns = await readEslintIgnore(config.verbose);

  async function getAllFiles() {
    if (config.verbose) {
      console.log(`Searching in directory: ${config.directoryPath} with pattern: ${config.pattern}`);
    }

    const options = {
      nodir: true,
      ignore: ignorePatterns,
    };

    return glob(path.join(config.directoryPath, config.pattern), options);
  }

  async function disableEslintErrorsForFile(filePath) {
    const results = await eslint.lintFiles(filePath);
    const { messages } = results[0];

    const rulesToDisable = new Set(messages.map((message) => message.ruleId).filter(Boolean));
    if (rulesToDisable.size === 0) {
      return;
    }

    const disableComments = Array.from(rulesToDisable)
      .map((rule) => `/* eslint-disable ${rule} */\n`)
      .join('');

    const fileContent = await fs.readFile(filePath, 'utf8');
    await fs.writeFile(filePath, `// ${config.commentPrefix}\n${disableComments}${fileContent}`);

    if (config.verbose) {
      console.log(`Processing file: ${filePath}`);
    }
  }

  async function processFiles(filePaths) {
    await Promise.map(filePaths, disableEslintErrorsForFile, { concurrency: config.concurrency });
  }

  return { getAllFiles, processFiles };
}
async function main() {
  const { argv } = yargs(hideBin(process.argv))
    .usage('Usage: $0 <directory> [options]')
    .option('pattern', {
      alias: 'p',
      describe: 'Glob pattern to match files',
      default: '**/*.js',
      type: 'string',
    })
    .option('concurrency', {
      alias: 'c',
      describe: 'Number of files to process concurrently',
      default: 10,
      type: 'number',
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      describe: 'Run with verbose logging',
    })
    .option('prefix', {
      alias: 'x',
      describe: 'Custom comment prefix for disabled ESLint rules',
      default: 'TODO: Fix later.',
      type: 'string',
    })
    .demandCommand(1, 'You must provide a directory path')
    .help();

  const config = {
    directoryPath: argv._[0],
    pattern: argv.pattern,
    concurrency: argv.concurrency,
    commentPrefix: argv.prefix,
    verbose: argv.verbose,
  };

  const { getAllFiles, processFiles } = await createESLintTool(config);

  try {
    const filePaths = await getAllFiles();
    await processFiles(filePaths);
    console.log('ESLint errors disabled for files.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
