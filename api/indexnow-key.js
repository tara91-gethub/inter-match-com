const getIndexNowKey = () =>
  process.env.INDEXNOW_KEY || process.env.INDEX_NOW_KEY || process.env.BING_INDEXNOW_KEY || '';

export default function handler(_req, res) {
  const key = getIndexNowKey().trim();

  if (!key) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('IndexNow key is not configured.');
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.end(`${key}\n`);
}
