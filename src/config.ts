// Environment configuration. Fails fast with a clear message if required
// values are missing; everything else has a sensible default.

export interface Config {
  botToken: string;
  /** Telegram user IDs allowed to run admin commands like /stats. */
  adminIds: number[];
}

export function loadConfig(): Config {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    console.error('Missing BOT_TOKEN environment variable.');
    process.exit(1);
  }
  return { botToken, adminIds: parseAdminIds(process.env.ADMIN_IDS) };
}

/** Parses a comma-separated ADMIN_IDS list into numeric Telegram user IDs. */
export function parseAdminIds(raw: string | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}
