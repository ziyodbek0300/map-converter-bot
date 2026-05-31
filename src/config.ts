// Environment configuration. Fails fast with a clear message if required
// values are missing.

export interface Config {
  botToken: string;
}

export function loadConfig(): Config {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    console.error('Missing BOT_TOKEN environment variable.');
    process.exit(1);
  }
  return { botToken };
}
