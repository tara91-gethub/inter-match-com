import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const DEFAULT_HOST = 'www.matchmakingbureau.com';
const DIST_DIR = path.resolve('dist');
const SITEMAP_FILE_PATTERN = /^sitemap.*\.xml$/i;
const MAX_URLS_PER_REQUEST = 10000;

const args = new Set(process.argv.slice(2));
const shouldPrintUrls = args.has('--print-urls') || process.env.INDEXNOW_LOG_URLS === 'true';
const isDryRun = args.has('--dry-run') || process.env.INDEXNOW_DRY_RUN === 'true';
const shouldSkipNonProduction =
  process.env.VERCEL === '1' &&
  process.env.VERCEL_ENV !== 'production' &&
  process.env.INDEXNOW_ALLOW_NON_PRODUCTION !== 'true';

const getIndexNowKey = () =>
  process.env.INDEXNOW_KEY || process.env.INDEX_NOW_KEY || process.env.BING_INDEXNOW_KEY || '';

const normalizeHost = (value = DEFAULT_HOST) =>
  value
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .trim();

const host = normalizeHost(process.env.INDEXNOW_HOST || DEFAULT_HOST);
const siteOrigin = `https://${host}`;
const key = getIndexNowKey().trim();
const keyLocation = `${siteOrigin}/indexnow.txt`;

const toAbsoluteUrl = (pathname) => {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${siteOrigin}${cleanPath === '/' ? '' : cleanPath}`;
};

const unique = (items) => [...new Set(items.filter(Boolean))];

const readSitemapUrls = () => {
  if (!existsSync(DIST_DIR)) {
    console.log('[IndexNow] dist directory not found. Skipping sitemap submission.');
    return [];
  }

  const sitemapFiles = readdirSync(DIST_DIR).filter((file) => SITEMAP_FILE_PATTERN.test(file));
  const urls = [];

  for (const file of sitemapFiles) {
    const xml = readFileSync(path.join(DIST_DIR, file), 'utf8');
    const matches = xml.matchAll(/<loc>(.*?)<\/loc>/g);

    for (const match of matches) {
      const url = match[1].trim();
      if (!url.endsWith('.xml')) {
        urls.push(url);
      }
    }
  }

  return unique(urls);
};

const routeFromDeletedFile = (filePath) => {
  const normalized = filePath.replaceAll('\\', '/');

  if (normalized.startsWith('src/content/post/')) {
    const slug = normalized.replace('src/content/post/', '').replace(/\.(md|mdx)$/i, '');

    return slug ? toAbsoluteUrl(`/blog/${slug}`) : null;
  }

  if (!normalized.startsWith('src/pages/')) {
    return null;
  }

  if (normalized.includes('[') || normalized.includes(']')) {
    return null;
  }

  const routePath = normalized
    .replace('src/pages/', '')
    .replace(/\.(astro|md|mdx|html|ts|js)$/i, '')
    .replace(/\/index$/i, '');

  if (!routePath || routePath === 'index') {
    return siteOrigin;
  }

  return toAbsoluteUrl(routePath);
};

const readDeletedUrlsFromGit = () => {
  const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA || process.env.INDEXNOW_PREVIOUS_SHA;
  const currentSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.INDEXNOW_CURRENT_SHA || 'HEAD';

  if (!previousSha) {
    return [];
  }

  try {
    const output = execFileSync(
      'git',
      ['diff', '--name-status', '--diff-filter=D', previousSha, currentSha, '--', 'src/pages', 'src/content/post'],
      { encoding: 'utf8' }
    );

    return unique(
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(/\s+/).slice(1).join(' '))
        .map(routeFromDeletedFile)
    );
  } catch (error) {
    console.warn(`[IndexNow] Could not inspect deleted URLs from git: ${error.message}`);
    return [];
  }
};

const chunk = (items, size) => {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const submitUrls = async (urls) => {
  const batches = chunk(urls, MAX_URLS_PER_REQUEST);
  const results = [];

  for (const [index, batch] of batches.entries()) {
    if (isDryRun) {
      console.log(`[IndexNow] Dry run batch ${index + 1}/${batches.length}: ${batch.length} URLs.`);
      results.push({ status: 'dry-run', urlCount: batch.length });
      continue;
    }

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host,
        key,
        keyLocation,
        urlList: batch,
      }),
    });

    const text = await response.text();
    const result = {
      status: response.status,
      ok: response.ok,
      urlCount: batch.length,
      responseText: text.trim(),
    };

    results.push(result);
    console.log(`[IndexNow] Batch ${index + 1}/${batches.length}: HTTP ${response.status} for ${batch.length} URLs.`);

    if (!response.ok) {
      throw new Error(`[IndexNow] Submission failed with HTTP ${response.status}: ${result.responseText}`);
    }
  }

  return results;
};

const main = async () => {
  if (shouldSkipNonProduction) {
    console.log(`[IndexNow] Vercel environment is ${process.env.VERCEL_ENV}. Skipping non-production submission.`);
    return;
  }

  if (!key) {
    console.log('[IndexNow] No INDEXNOW_KEY, INDEX_NOW_KEY, or BING_INDEXNOW_KEY found. Skipping submission.');
    return;
  }

  const sitemapUrls = readSitemapUrls();
  const deletedUrls = readDeletedUrlsFromGit();
  const urls = unique([...sitemapUrls, ...deletedUrls]);

  if (!urls.length) {
    console.log('[IndexNow] No URLs found to submit.');
    return;
  }

  console.log(`[IndexNow] Endpoint: ${INDEXNOW_ENDPOINT}`);
  console.log(`[IndexNow] Key location: ${keyLocation}`);
  console.log(`[IndexNow] Sitemap URLs: ${sitemapUrls.length}`);
  console.log(`[IndexNow] Deleted URLs from git: ${deletedUrls.length}`);
  console.log(`[IndexNow] Total URLs to submit: ${urls.length}`);

  if (shouldPrintUrls) {
    console.log('[IndexNow] URLs sent:');
    for (const url of urls) {
      console.log(`- ${url}`);
    }
  }

  await submitUrls(urls);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
