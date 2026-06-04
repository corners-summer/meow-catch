/**
 * 一键把 dist/ 上传到腾讯云 COS（静态网站托管）。
 *
 * 用法：
 *   1. 复制 .env.example 为 .env，填入你的 COS 配置（密钥只在本地，不会进 git）
 *   2. npm run deploy   （会先 build 再上传）
 *
 * 不把密钥写进代码 / 仓库：全部从环境变量（.env）读取。
 */
import { readdirSync, statSync, createReadStream } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import 'dotenv/config'
import COS from 'cos-nodejs-sdk-v5'
import mime from 'mime-types'

const root = fileURLToPath(new URL('..', import.meta.url))
const distDir = join(root, 'dist')

const { COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION } = process.env

function fail(msg) {
  console.error(`\x1b[31m✗ ${msg}\x1b[0m`)
  process.exit(1)
}

if (!COS_SECRET_ID || !COS_SECRET_KEY || !COS_BUCKET || !COS_REGION) {
  fail(
    '缺少 COS 配置。请复制 .env.example 为 .env 并填写 ' +
      'COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION'
  )
}

// COS 部署在域名根目录，用 '/' 作为 base 构建（覆盖给 GitHub Pages 用的子路径）
console.log('构建中（base=/）...')
execSync('npm run build', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, DEPLOY_BASE: '/' },
})

try {
  statSync(distDir)
} catch {
  fail('未找到 dist/ 目录，构建可能失败了')
}

const cos = new COS({ SecretId: COS_SECRET_ID, SecretKey: COS_SECRET_KEY })

// 递归收集 dist 下所有文件
function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

// 带 hash 的资源可长期缓存；HTML 不缓存，保证发版后立即生效
function cacheControl(key) {
  return key.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache'
}

function putObject(file) {
  const key = relative(distDir, file).split(sep).join('/')
  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: key,
        Body: createReadStream(file),
        ContentType: mime.lookup(file) || 'application/octet-stream',
        CacheControl: cacheControl(key),
      },
      (err) => (err ? reject(err) : resolve(key))
    )
  })
}

const files = walk(distDir)
console.log(`准备上传 ${files.length} 个文件到 cos://${COS_BUCKET} (${COS_REGION}) ...`)

let done = 0
await Promise.all(
  files.map((f) =>
    putObject(f)
      .then((key) => {
        done++
        console.log(`  \x1b[32m↑\x1b[0m ${key}`)
      })
      .catch((err) => fail(`上传失败：${f}\n${err.message || err}`))
  )
)

console.log(`\x1b[32m✓ 完成，共上传 ${done} 个文件。\x1b[0m`)
console.log('若已开启「静态网站」并绑定备案域名，刷新即可看到最新版本。')
