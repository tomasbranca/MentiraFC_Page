#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: process.platform === 'win32' && command === 'npm',
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });

const getArgValue = (...flags) => {
  const index = process.argv.findIndex((arg) => flags.includes(arg));

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
};

const askCommitMessage = async () => {
  const argMessage = getArgValue('--message', '--msg', '-m');

  if (argMessage?.trim()) {
    return argMessage.trim();
  }

  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question('Commit message: ');
    return answer.trim();
  } finally {
    rl.close();
  }
};

const main = async () => {
  const message = await askCommitMessage();

  if (!message) {
    throw new Error('Commit message is required.');
  }

  await run('git', ['add', '.']);
  await run('git', ['commit', '-m', message]);
  await run('git', ['push', 'origin', 'HEAD']);
  await run('npm', ['run', 'deploy']);
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
