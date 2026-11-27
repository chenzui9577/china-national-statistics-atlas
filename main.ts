// 中国数据图谱的参赛交付程序：把静态站点 app/ 与截图 screenshots/ 复制到输出目录，并生成 dossier.json。
// 只依赖 Node 标准库与本场 kit 的 vendor 构建器；本机自检时用 MAKEFUN_OUTPUT_DIR 指定输出目录，评测时默认 /output。
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputRoot = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputRoot, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputRoot, 'app'), { recursive: true });

const shotsTarget = join(outputRoot, 'screenshots');
mkdirSync(shotsTarget, { recursive: true });
const shotsSource = join(repoRoot, 'screenshots');
if (existsSync(shotsSource)) {
  cpSync(shotsSource, shotsTarget, { recursive: true });
}

// 限额与评测端保持一致：截图最多 4 张且单张不超过 256KiB，app/ 文件数与体积也有上限，正文摘录 160KiB。
const dossierText = buildDossier(outputRoot, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outputRoot, 'dossier.json'), dossierText);
console.log('中国数据图谱已交付到', outputRoot);
