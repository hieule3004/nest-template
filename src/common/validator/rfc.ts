import * as fs from 'fs';
import * as Heket from 'heket';
import * as https from 'https';

const { RuleNotFoundError } = Heket as any;

//---- Definition ----//

const RESOURCE_DIR = 'dist/resources';

/** add validator here with rfc document id and rule to parse */
export const ValidatorType = {
  email: { docId: 5322, ruleName: 'addr-spec' },
  phone: { docId: 3966, ruleName: 'telephone-subscriber' },
  isoDateTime: { docId: 3339, ruleName: 'date-time' },
};

type ValidatorKey = keyof typeof ValidatorType;
const rfc: Partial<Record<ValidatorKey, Heket.Parser>> = {};

{
  /** read rfc specification */
  Object.entries(ValidatorType).forEach(([type, { docId, ruleName }]) =>
    _registerValidator(type as ValidatorKey, docId, ruleName),
  );
}

//---- Validator ----//
/** export validator here */

export const rfcValidator = (name: ValidatorKey, raw: string) =>
  rfc[name]?.parse(raw);

//---- Helper ----//

const ABNF_URL = 'https://author-tools.ietf.org/api/abnf/extract';

/** Helper function to create parser */
function _registerValidator(
  type: ValidatorKey,
  id: number,
  ruleName: string,
): void {
  // read offline spec
  fs.readFile(`${RESOURCE_DIR}/${id}.abnf`, 'utf-8', (_, abnf) => {
    try {
      if (abnf) {
        _addParser(type, id, ruleName, abnf);
        return;
      }

      // read online spec if failed
      https
        .get(`${ABNF_URL}?doc=${id}`, (res) => {
          let abnf = '';
          res.on('data', (chunk) => (abnf += chunk.toString()));
          res.on('end', () => _addParser(type, id, ruleName, abnf));
        })
        .on('error', () => undefined)
        .end();
    } catch (e) {
      // do nothing
    }
  });
}

/** Add parser to RFC map */
function _addParser(
  type: ValidatorKey,
  id: number,
  ruleName: string,
  abnf: string,
): void {
  // fix spacing of extracted document to follow ABNF format
  abnf = abnf.split('\n').reduce((a, s) => {
    // remove comments
    const commentTokenIdx = s.indexOf(' ;');
    if (commentTokenIdx > 0) s = s.substring(0, commentTokenIdx);
    s = s.trim();
    // add new rule
    if (s.match(/^[A-Za-z0-9-\s]+=\/?(\s+|$)/)) a += '\n\n' + s;
    // join multiline rule
    else if (a[a.length - 1]?.match(/[=/]/) || s[0] === '/') a += ' ' + s;
    return a;
  }, '');

  // parse RFC, remove lines until parsable
  let rules: any;
  while (!rules) {
    try {
      rules = Heket.createRuleList(abnf);
      break;
    } catch (e: any) {
      let exp = _computeRemovedStringSignature(e);
      exp = exp.replace(/([$&])/g, '\\$1');
      const re = RegExp(`([^\n]*${exp})`, 'g');
      const newAbnf = abnf.replace(re, ';$1');
      if (abnf === newAbnf) throw e;
      abnf = newAbnf;
    }
  }

  // save to local to be used if needed
  fs.mkdirSync(RESOURCE_DIR, { recursive: true });
  fs.writeFile(`${RESOURCE_DIR}/${id}.abnf`, abnf, 'utf-8', () => undefined);
  // add parser to cache
  rfc[type] = Heket.createParser(rules.getRuleByName(ruleName), rules);
}

function _computeRemovedStringSignature(e: any): string {
  if (e instanceof RuleNotFoundError) return e.getRuleName();
  const match = (e.message as string).match(/^Invalid rule name: (\S+)/);
  if (match) return match[1];
  throw e;
}
