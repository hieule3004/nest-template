import * as fs from 'fs';
import * as Heket from 'heket';
import * as https from 'https';

const { RuleNotFoundError } = Heket as any;

//---- Definition ----//

const RESOURCE_DIR = 'dist/resources';

/** add validator here with rfc document id and rule to parse */
const ValidatorType = {
  email: { docId: 5322, ruleName: 'addr-spec' },
  phone: { docId: 3966, ruleName: 'telephone-subscriber' },
  iso8601DateTime: { docId: 3339, ruleName: 'date-time' },
};

type ValidatorKey = keyof typeof ValidatorType;
const rfc: Partial<Record<ValidatorKey, Heket.Parser>> = {};

/** read rfc specification */
Object.entries(ValidatorType).forEach(([type, { docId, ruleName }]) =>
  _registerValidator(type as ValidatorKey, docId, ruleName),
);

//---- Validator ----//
/** export validator here */

export const emailValidator = (raw: string): boolean =>
  !!rfc.email?.parseSafe(raw);

export const phoneValidator = (raw: string): boolean =>
  !!rfc.phone?.parseSafe(raw);

export const iso8601DateValidator = (raw: string): boolean =>
  !!rfc.iso8601DateTime?.parseSafe(raw);

//---- Helper ----//

const ABNF_URL = 'https://author-tools.ietf.org/api/abnf/extract';

/** Helper function to create parser */
function _registerValidator(
  type: ValidatorKey,
  id: number,
  ruleName: string,
): void {
  // read offline spec
  fs.readFile(
    `${RESOURCE_DIR}/${id}.abnf`,
    { encoding: 'utf-8' },
    (_, abnf) => {
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
    },
  );
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
    else if (a[a.length - 1]?.match(/[=/]/)) a += ' ' + s;
    return a;
  }, '');

  // parse RFC, remove lines until parsable
  let rules: any;
  while (!rules) {
    try {
      rules = Heket.createRuleList(abnf);
      break;
    } catch (e: any) {
      if (!(e instanceof RuleNotFoundError)) throw e;
      // remove uncompilable rule, detect loop
      const re = new RegExp(`([^\n]*${e.rule_name})`, 'g');
      const newAbnf = abnf.replace(re, ';$1');
      if (abnf === newAbnf) throw e;
      abnf = newAbnf;
    }
  }

  // save to local to be used if needed
  fs.mkdirSync(RESOURCE_DIR, { recursive: true });
  fs.writeFile(
    `${RESOURCE_DIR}/${id}.abnf`,
    abnf,
    { encoding: 'utf-8' },
    () => undefined,
  );
  // add parser to cache
  rfc[type] = Heket.createParser(rules.getRuleByName(ruleName), rules);
}
