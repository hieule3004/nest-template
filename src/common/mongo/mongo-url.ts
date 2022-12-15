class InvalidUrlError extends TypeError {
  input: string;
  code = 'ERR_INVALID_URL';

  constructor(url: string) {
    super('Invalid URL');
    this.name = `${super.name} [${this.code}]`;
    this.input = url;
  }
}

interface MongoURL
  extends Omit<URL, 'origin' | 'host' | 'hostname' | 'port' | 'hash'> {
  hostList: string[];
  hosts: Record<string, string[]>;
  useSeedList: boolean;
}

class MongoURL {
  constructor(url: string | MongoURL) {
    Object.assign(this, typeof url === 'string' ? parse(url) : url);
  }
}

const FAKE_HOST = 'host';

function parse(url: string): MongoURL {
  const _url = parseSafe(url);
  if (!_url) throw new InvalidUrlError(url);
  return _url;
}

function parseSafe(url: string): MongoURL | undefined {
  try {
    const schemeEnd = url.indexOf('//') + 2;

    const credLast = url.indexOf('@');
    const domainStart = credLast > 0 ? credLast + 1 : schemeEnd;

    const pathStart = url.indexOf('/', schemeEnd);

    // parse URL with fake host to get all URL properties except from host
    const fakeUrl =
      url.substring(0, domainStart) + FAKE_HOST + url.substring(pathStart);
    const _url = new URL(fakeUrl);

    const schemeMatch = _url.protocol.match(/^mongodb(\+srv)?:$/);
    if (!schemeMatch) return undefined;

    // handle multiple hosts for Mongo URL
    const hostString = url.substring(domainStart, pathStart);
    const hostList = hostString.split(',');
    // validate and parse hosts to record object
    const hosts: Record<string, string[]> = {};
    for (const host of hostList) {
      const { username, pathname, hostname, port } = new URL(
        `${_url.protocol}//${host}`,
      );
      if (username || pathname) return undefined;

      if (!hosts[hostname]) hosts[hostname] = [];
      hosts[hostname].push(port);
    }

    return {
      href: url,
      protocol: _url.protocol,
      useSeedList: !!schemeMatch[1],
      username: _url.username,
      password: _url.password,
      hostList: hostList,
      hosts: hosts,
      pathname: _url.pathname,
      search: _url.search,
      searchParams: _url.searchParams,
    } as MongoURL;
  } catch (_) {
    return undefined;
  }
}

export { MongoURL };
