import * as https from 'https';
import * as fs from 'fs';
import * as Heket from 'heket';

//---- Struct ----//

const { RuleNotFoundError } = Heket as any;

const ABNF_URL = 'https://author-tools.ietf.org/api/abnf/extract';
const RESOURCE_DIR = 'dist/resources';

const rfc: { [docId: number]: Heket.Parser } = {};

//---- Static init ----//

/** read rfc specification */
{
  registerValidator(3966, 'telephone-subscriber');
  registerValidator(5322, 'addr-spec');
  registerValidator(3339, 'date-time');
}

//---- Validator ----//

export const emailValidator = (raw: string): boolean =>
  !!rfc[5322].parseSafe(raw);

export const phoneValidator = (raw: string): boolean =>
  !!rfc[3966].parseSafe(raw);

export const iso8601DateValidator = (raw: string): boolean =>
  !!rfc[3339].parseSafe(raw);

//---- Helper function ----//

/** Helper function to create parser */
function registerValidator(id: number, ruleName: string): void {
  try {
    const clientRequest = https.get(`${ABNF_URL}?doc=${id}`, (res) => {
      let abnf = '';
      res.on('data', (chunk) => (abnf += chunk.toString()));
      res.on('end', () => _addParser(id, ruleName, abnf));
    });
    clientRequest.end();
  } catch (e) {
    // use offline version in case of connection issue
    fs.readFile(
      `${RESOURCE_DIR}/${id}.abnf`,
      { encoding: 'utf-8' },
      (_, abnf) => _addParser(id, ruleName, abnf),
    );
  }
}

/** Add parser to {@link rfc} map */
function _addParser(id: number, ruleName: string, abnf: string): void {
  // fix spacing of extracted document to follow ABNF format
  abnf = abnf.split('\n').reduce((a, s) => {
    // remove comments
    const commentTokenIdx = s.indexOf(' ;');
    if (commentTokenIdx > 0) s = s.substring(0, commentTokenIdx);
    s = s.trim();
    // add new rule
    if (s.match(/^[A-Za-z0-9-\s]+=[/\s]+/)) a += '\n\n' + s;
    // join multiline rule
    else if (a[a.length - 1].match(/[=/]/)) a += s;
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
  fs.writeFile(`${RESOURCE_DIR}/${id}.abnf`, abnf, () => undefined);
  // add parser to cache
  rfc[id] = Heket.createParser(rules.getRuleByName(ruleName), rules);
}
