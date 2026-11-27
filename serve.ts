// 中国数据图谱的本地预览服务器：把 app/ 当作站点根目录用静态文件方式提供访问，方便逐页点测与截图。
// 用法：node serve.ts [--port 8091]，然后在浏览器打开提示的本地地址即可。
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const argv = process.argv.slice(2);
const portAt = argv.indexOf('--port');
const wanted = portAt >= 0 ? Number(argv[portAt + 1]) : 8091;
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8091;

const mimeByExt: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  const parsed = new URL(req.url ?? '/', 'http://127.0.0.1');
  let pathPart = '/';
  try {
    pathPart = decodeURIComponent(parsed.pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (pathPart.endsWith('/')) pathPart += 'index.html';
  const filePath = resolve(join(appRoot, normalize(pathPart)));
  if (filePath !== appRoot && !filePath.startsWith(appRoot + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let size = 0;
  try {
    const info = statSync(filePath);
    if (!info.isFile()) throw new Error('not-file');
    size = info.size;
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': mimeByExt[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`中国数据图谱预览中：http://localhost:${port}`);
});
