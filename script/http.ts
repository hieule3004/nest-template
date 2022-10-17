import * as http from 'http';
import * as https from 'https';

const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  ALL: 'ALL',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD',
};

interface HttpRequest {
  method: keyof typeof HttpMethod;
  url: string;
  headers?: { [_: string]: string };
  params?: { [_: string]: string | number | boolean };
  body?: any;
  callback?: (rawResponse: string) => void;
}

/** Very simple wrapper to {@link http} library for ease of use */
class HttpClient {
  content = '';

  request(request: HttpRequest): void {
    const { method, url, body, headers, params, callback } = request;

    // add request params
    const _url = params
      ? `${url}?${Object.entries(params)
          .map(([k, v]) => `${k}=${v}`)
          .join('&')}`
      : url;

    // add headers
    const _options: https.RequestOptions = headers
      ? { method, headers }
      : { method };

    let _clientRequest: http.ClientRequest;
    // add response callback
    if (callback) {
      const _callback = (response: http.IncomingMessage) =>
        response
          .on('data', (chunk) => (this.content += chunk.toString()))
          .on('end', () => callback(this.content));
      _clientRequest = https.request(_url, _options, _callback);
    } else {
      _clientRequest = https.request(_url, _options);
    }

    // add request body
    if (body) _clientRequest.write(JSON.stringify(body));

    // send request
    _clientRequest.end();
  }

  get(request: HttpRequest): void {
    return this.request({ ...request, method: 'GET' });
  }
}

export { HttpClient };
