#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let tsPackagePath;
try {
  tsPackagePath = require.resolve('typescript/package.json');
} catch (error) {
  // TypeScript is not installed yet; nothing to patch.
  process.exit(0);
}

const tsRoot = path.dirname(tsPackagePath);
const filesToPatch = ['lib/typescript.js', 'lib/tsserverlibrary.js'];
const extensionSymbols = [
  'supportedTSExtensions',
  'supportedTSXExtensions',
  'supportedTSExtensionsFlat',
  'supportedTSXExtensionsFlat',
  'supportedJSExtensions',
  'supportedJSXExtensions',
  'supportedJSExtensionsFlat',
  'supportedJSXExtensionsFlat'
];

let patchedFiles = [];

for (const relativePath of filesToPatch) {
  const filePath = path.join(tsRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  for (const symbol of extensionSymbols) {
    const result = ensureListIncludes(content, symbol, '.vue');
    if (result.changed) {
      content = result.source;
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    patchedFiles.push(relativePath);
  }
}

tryPatchVueTscBin();

if (patchedFiles.length > 0) {
  console.log(
    `[lint-setup] Added .vue extension support to TypeScript (${patchedFiles.join(', ')})`
  );
}

function ensureListIncludes(source, symbol, extension) {
  const assignmentRegex = new RegExp(`(${symbol}\\s*=\\s*)([\\s\\S]*?);`);
  const match = assignmentRegex.exec(source);
  if (!match) {
    return { source, changed: false };
  }

  const [fullMatch, prefix, expression] = match;
  const listStart = expression.indexOf('[');
  if (listStart === -1) {
    return { source, changed: false };
  }

  const listEnd = findMatchingBracket(expression, listStart);
  if (listEnd === -1) {
    return { source, changed: false };
  }

  const beforeList = expression.slice(0, listStart + 1);
  const listContent = expression.slice(listStart + 1, listEnd);
  const afterList = expression.slice(listEnd);

  if (listContent.includes(`'${extension}'`) || listContent.includes(`"${extension}"`)) {
    return { source, changed: false };
  }

  const trimmed = listContent.trim();
  const usesNewlines = /\n/.test(listContent);
  const hasTrailingComma = /,\s*$/.test(trimmed);
  const quoteMatch = listContent.match(/['"]/);
  const quote = quoteMatch ? quoteMatch[0] : '"';
  const newEntry = `${quote}${extension}${quote}`;

  let insertion;
  if (usesNewlines) {
    const lastNewline = listContent.lastIndexOf('\n');
    const indentMatch = lastNewline >= 0 ? listContent.slice(lastNewline + 1).match(/^\s*/) : null;
    const indent = indentMatch ? indentMatch[0] : '';
    const commaPrefix = trimmed && !hasTrailingComma ? ',' : '';
    insertion = `${commaPrefix}\n${indent}${newEntry}`;
  } else if (trimmed.length === 0) {
    insertion = newEntry;
  } else {
    const commaPrefix = hasTrailingComma ? '' : ',';
    insertion = `${commaPrefix} ${newEntry}`;
  }

  const newListContent = listContent + insertion;
  const newExpression = beforeList + newListContent + afterList;
  const updatedAssignment = fullMatch.replace(expression, newExpression);
  const updatedSource =
    source.slice(0, match.index) + updatedAssignment + source.slice(match.index + fullMatch.length);

  return { source: updatedSource, changed: true };
}

function findMatchingBracket(content, startIndex) {
  let depth = 0;
  for (let index = startIndex; index < content.length; index += 1) {
    const char = content[index];
    if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function tryPatchVueTscBin() {
  let vueTscBin;
  try {
    vueTscBin = require.resolve('vue-tsc/bin/vue-tsc.js');
  } catch (error) {
    return;
  }

  if (!fs.existsSync(vueTscBin)) {
    return;
  }

  const needle = "throw 'Search string not found: ' + JSON.stringify(search.toString());";
  const replacement = "console.warn('[vue-tsc] Skipped patch for', search);";

  const content = fs.readFileSync(vueTscBin, 'utf8');
  if (!content.includes(needle)) {
    return;
  }

  fs.writeFileSync(vueTscBin, content.replace(needle, replacement), 'utf8');
  patchedFiles.push('vue-tsc/bin/vue-tsc.js');
}
