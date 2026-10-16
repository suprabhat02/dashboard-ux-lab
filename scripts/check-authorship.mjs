// Fails CI if any commit carries AI-tool attribution: a co-author or session
// trailer, a "generated with" footer, or an author/committer identity of an AI
// tool. Every commit in this repository is authored by people, under their
// own names. Human contributors are welcome and unaffected.
//
// Needs full history: the CI checkout uses fetch-depth: 0.
import { execFileSync } from 'node:child_process';

const AI = /claude|anthropic|copilot|chatgpt|openai|gemini|cursor(?:\.sh|bot)|devin/i;
const SEP = '\u001e';
const FIELD = '\u001f';

const log = execFileSync(
  'git',
  ['log', '--all', `--format=%H${FIELD}%an <%ae>${FIELD}%cn <%ce>${FIELD}%B${SEP}`],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);

const problems = [];
for (const entry of log.split(SEP)) {
  const [sha, author, committer, body = ''] = entry.trim().split(FIELD);
  if (!sha) continue;
  const short = sha.slice(0, 7);
  if (AI.test(author ?? '')) problems.push(`${short}: author is ${author}`);
  if (AI.test(committer ?? '')) problems.push(`${short}: committer is ${committer}`);
  for (const line of body.split('\n')) {
    const trailer = /^\s*(co-authored-by|signed-off-by|[\w-]*session)\s*:/i.test(line);
    const footer = /generated (?:with|by)/i.test(line);
    if ((trailer || footer) && AI.test(line)) problems.push(`${short}: "${line.trim()}"`);
  }
}

if (problems.length) {
  console.error(`✗ AI attribution found in commit history:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('✓ Authorship: every commit is attributed to people only');
