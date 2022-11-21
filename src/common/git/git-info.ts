import * as fs from 'fs';
import * as path from 'path';

const gitPath = path.resolve(process.cwd(), '.git');

const raw = fs.readFileSync(path.resolve(gitPath, 'config'), {
  encoding: 'utf-8',
});

export const gitInfo = raw.split(/\n(?!\t)/).reduce((target, chunk) => {
  const ss = chunk.split('\n\t');
  const key = ss.shift() as string;
  const [type, name] = key.substring(1, key.length - 1).split(' ', 2);
  const typeName = name?.substring(1, name?.length - 1);
  if (!target[type]) target[type] = {};
  const inner = ss.reduce((acc, line) => {
    const [k, v] = line.split(' = ', 2);
    acc[k] = v;
    return acc;
  }, {} as any);
  if (name) target[type][typeName] = inner;
  else target[type] = inner;
  return target;
}, {} as any);
console.log(gitInfo.remote[gitInfo.branch.master.remote].url);

const mergeHead = fs
  .readFileSync(path.resolve(gitPath, 'HEAD'), {
    encoding: 'utf-8',
  })
  .split(/\s+/)[1];

export const currentBranch = Object.entries(gitInfo.branch).find(
  ([, { merge }]: any[]) => merge === mergeHead,
)?.[0] as string;

export const remote = gitInfo.branch[currentBranch].remote;

export const remoteUrl = gitInfo.remote[remote].url;

export const repoUrl = fs
  .readFileSync(path.resolve(gitPath, 'FETCH_HEAD'), {
    encoding: 'utf-8',
  })
  .split('\n')
  .find((l) => !l.includes('not-for-merge'))
  ?.split(/\s+/)[4] as string;
