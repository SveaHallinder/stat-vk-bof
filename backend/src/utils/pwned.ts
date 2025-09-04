import https from 'https';
import crypto from 'crypto';
import { config } from '../config';

function sha1Hex(str: string): string {
  return crypto.createHash('sha1').update(str).digest('hex').toUpperCase();
}

export async function isPasswordPwned(password: string): Promise<boolean> {
  if (!config.pwnedPasswords.enabled) return false;

  const hash = sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const options: https.RequestOptions = {
    hostname: 'api.pwnedpasswords.com',
    path: `/range/${prefix}`,
    method: 'GET',
    headers: {
      'Add-Padding': 'true',
      'User-Agent': 'vk-stat-password-check/1.0',
    },
  };

  return new Promise<boolean>((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const lines = data.split('\n');
          for (const line of lines) {
            const [lineSuffix, countStr] = line.trim().split(':');
            if (!lineSuffix || !countStr) continue;
            if (lineSuffix.toUpperCase() === suffix) {
              const count = parseInt(countStr, 10) || 0;
              resolve(count > 0);
              return;
            }
          }
          resolve(false);
        } catch {
          // Vid fel: fail-open om inte required
          resolve(config.pwnedPasswords.required ? true : false);
        }
      });
    });
    req.on('error', () => {
      resolve(config.pwnedPasswords.required ? true : false);
    });
    req.setTimeout(config.pwnedPasswords.timeoutMs, () => {
      req.destroy(new Error('Timeout'));
    });
    req.end();
  });
}

