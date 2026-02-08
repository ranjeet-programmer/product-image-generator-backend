/**
 * Keep-Alive Cron
 * 
 * Render's free tier spins down the service after 15 minutes of inactivity.
 * This self-ping mechanism hits the /health endpoint every 4 minutes
 * to keep the service alive permanently.
 * 
 * Only activates when RENDER_EXTERNAL_URL is set (i.e., on Render).
 * Does nothing in local development.
 */

const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

export function startKeepAlive(): void {
  const renderUrl = process.env.RENDER_EXTERNAL_URL;

  if (!renderUrl) {
    console.log('[Keep-Alive] Not on Render, skipping.');
    return;
  }

  const healthUrl = `${renderUrl}/health`;

  console.log(`[Keep-Alive] Started. Pinging ${healthUrl} every 4 minutes.`);

  setInterval(async () => {
    try {
      const res = await fetch(healthUrl);
      const data = (await res.json()) as { timestamp: string };
      console.log(`[Keep-Alive] Ping OK at ${data.timestamp}`);
    } catch (err) {
      console.error('[Keep-Alive] Ping failed:', err);
    }
  }, PING_INTERVAL_MS);
}
