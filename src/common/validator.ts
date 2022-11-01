import * as https from 'https';
import * as fs from 'fs';
import * as Heket from 'heket';

//---- Struct ----//

const ABNF_URL = 'https://author-tools.ietf.org/api/abnf/extract';
const RESOURCE_DIR = 'dist/resources';

const rfc: { [docId: number]: Heket.Parser } = {};

//---- Static init ----//

/** read rfc specification */
{
  registerValidator(3966, 'telephone-subscriber');
  registerValidator(5322, 'addr-spec');
}

//---- Validator ----//

export const emailValidator = (raw: string): boolean =>
  !!rfc[5322].parseSafe(raw);

export const phoneValidator = (raw: string): boolean =>
  !!rfc[3966].parseSafe(raw);

//---- Helper function ----//

/** Helper function to create parser */
function registerValidator(id: number, ruleName: string): void {
  try {
    let abnf = '';
    const clientRequest = https.get(`${ABNF_URL}?doc=${id}`);
    clientRequest.on('data', (chunk) => (abnf += chunk.toString()));
    clientRequest.on('end', () => _addParser(id, ruleName, abnf));
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
  abnf = abnf
    .trim()
    .replace(/\n+/g, '\n\n')
    .replace(/\n\n(\s+;)/g, '\n$1')
    .replace(/(;[^\n]+)\n\n(\s+)/g, '$1\n$2')
    .replace(/\n\n\s+/g, ' ');

  // parse RFC, remove lines until parsable
  let rules: any;
  while (!rules) {
    try {
      rules = Heket.createRuleList(abnf);
    } catch (e: any) {
      let match: RegExpMatchArray | undefined;
      // rule with unknown value
      if (!match) match = e.message.match(/Invalid rule name: (.+)/);
      // rule alt without base
      if (!match) match = e.message.match(/Rule not found: <(.+)>/);
      // default throw
      if (!match) throw e;
      // remove uncompilable rule
      abnf = abnf.replace(new RegExp(`([^\n]*${match[1]})`, 'g'), ';$1');
    }
  }

  // save to local to be used if needed
  fs.writeFile(`${RESOURCE_DIR}/${id}.abnf`, abnf, () => undefined);
  // add parser to cache
  rfc[id] = Heket.createParser(rules.getRuleByName(ruleName), rules);
}
