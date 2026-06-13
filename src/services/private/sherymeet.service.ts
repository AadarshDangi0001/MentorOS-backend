import crypto from 'crypto';
import { ENV } from '../../config/env';
import logger from '../../utils/logger';

export interface SheryMeetUser {
  _id: string;
  userName: string;
  role: string;
  email: string;
}

export class SheryMeetService {
  private get credentials() {
    return {
      apiKey: ENV.SHERYMEET_API_KEY,
      clientSecret: ENV.SHERYMEET_CLIENT_SECRET,
      baseUrl: ENV.SHERYMEET_BASE_URL,
    };
  }

  private generateHeaders(
    method: string,
    path: string,
    body?: any,
    query: string = ''
  ) {
    const { apiKey, clientSecret, baseUrl } = this.credentials;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const requestId = 'client_' + crypto.randomBytes(8).toString('hex');

    // Extract host from baseUrl
    let host = 'localhost:3001';
    try {
      const urlObj = new URL(baseUrl);
      host = urlObj.host; // e.g. "localhost:3001" or "api.sherymeet.com"
    } catch (e) {
      logger.error('Invalid SHERYMEET_BASE_URL: ' + baseUrl);
    }

    // 1. Compute Body Hash
    let bodyHash = crypto.createHash('sha256').update('').digest('hex');
    if (body) {
      const sortKeys = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(sortKeys);
        return Object.keys(obj)
          .sort()
          .reduce((acc: any, key) => {
            acc[key] = sortKeys(obj[key]);
            return acc;
          }, {});
      };
      const canonicalBody = JSON.stringify(sortKeys(body));
      bodyHash = crypto.createHash('sha256').update(canonicalBody, 'utf8').digest('hex');
    }

    // 2. Build Payload
    const payload = [
      method.toUpperCase(),
      host,
      path,
      query,
      timestamp,
      nonce,
      bodyHash,
      '', // Empty origin for server-to-server calls
    ].join('\n');

    // 3. Sign Payload
    const signature = crypto
      .createHmac('sha256', clientSecret)
      .update(payload, 'utf8')
      .digest('hex');

    return {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
      'x-api-key': apiKey,
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature-version': 'v1',
      'x-signature': signature,
    };
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const { baseUrl } = this.credentials;
    const headers = this.generateHeaders(method, path, body);
    const url = `${baseUrl}${path}`;

    logger.info(`SheryMeet Request: ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data: any = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMsg = data?.message || response.statusText || 'SheryMeet request failed';
      logger.error(`SheryMeet API Error: ${errorMsg}`, { status: response.status, data });
      throw new Error(errorMsg);
    }

    return data;
  }

  async createMeeting(host: SheryMeetUser, passcode: string): Promise<any> {
    return this.request('POST', '/api/v1/client/meet', { host, passcode });
  }

  async joinAsHost(roomId: string, user: SheryMeetUser, passcode: string): Promise<any> {
    return this.request('POST', '/api/v1/client/meet/join-as-host', { roomId, user, passcode });
  }

  async joinAsUser(roomId: string, user: SheryMeetUser): Promise<any> {
    return this.request('POST', '/api/v1/client/meet/join-as-user', { roomId, user });
  }

  async endMeeting(roomId: string): Promise<any> {
    return this.request('POST', '/api/v1/client/meet/end-meet', { roomId });
  }
}

export const sheryMeetService = new SheryMeetService();
