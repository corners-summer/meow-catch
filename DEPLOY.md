# 部署到腾讯云 COS（微信 / 国内浏览器都能玩）

目标：让 https://你的备案域名/ 在**微信里和国内浏览器**都能直接打开玩。
核心要点：网站托管在腾讯云 COS，并绑定一个**完成 ICP 备案**的域名（微信放行的硬性前提）。

> 托管费用对这个项目几乎为 0（打包 <1MB）。主要花费是域名（几十元/年）。备案免费，约 1–2 周。

---

## 一、准备：腾讯云账号与密钥

1. 注册并实名腾讯云账号：https://cloud.tencent.com/
2. 创建一对 API 密钥（建议用子账号、仅授权这个桶）：
   访问管理 → 访问密钥：https://console.cloud.tencent.com/cam/capi
   记下 **SecretId / SecretKey**（SecretKey 只显示一次）。

## 二、创建 COS 存储桶并开启静态网站

1. 进入对象存储控制台：https://console.cloud.tencent.com/cos/bucket → **创建存储桶**
   - 名称：如 `meow-catch`（创建后完整名为 `meow-catch-<APPID>`）
   - 地域：就近选，如 `广州 ap-guangzhou`
   - 访问权限：**公有读、私有写**
2. 进桶 → 「基础配置 → 静态网站」：**开启**
   - 索引文档：`index.html`
   - 错误文档：`index.html`（SPA 友好）

## 三、本地配置并一键上传

```bash
cd meow-catch
npm install                 # 安装依赖（含部署用的 COS SDK）
cp .env.example .env        # 然后编辑 .env，填入下面 4 个值
```

`.env` 内容（`.env` 已被 git 忽略，不会提交）：

```
COS_SECRET_ID=你的SecretId
COS_SECRET_KEY=你的SecretKey
COS_BUCKET=meow-catch-1250000000   # 你的「名称-APPID」
COS_REGION=ap-guangzhou            # 你桶的地域
```

上传（会自动先 build 再上传 dist/）：

```bash
npm run deploy
```

此时可用 COS 自带的「静态网站访问节点」先验证页面是否正常（这个默认地址是 http、且未备案，仅自测用）。

## 四、绑定备案域名 + HTTPS（微信可访问的关键）

1. **域名**：在腾讯云买一个域名（或把已有域名转入/解析过来）。
   - 域名注册：https://dnspod.cloud.tencent.com/
2. **ICP 备案**：https://console.cloud.tencent.com/beian
   - 个人主体即可，需要这台云资源（COS/CDN）作为接入，按流程提交，约 1–2 周。
   - ⚠️ 域名**必须备案**，否则微信内打开会被拦截。
3. **自定义域名 + HTTPS**：
   - 申请**免费 SSL 证书**：https://console.cloud.tencent.com/ssl
   - 在 COS 桶「域名与传输管理 → 自定义源站域名 / 自定义加速域名」绑定你的域名，并关联证书开启 HTTPS。
   - 按提示在域名解析里加 `CNAME` 记录指向 COS 给的地址。
   - （COS 自定义域名会走 CDN，国内访问更快更稳。）

完成后访问 `https://你的域名/` —— 浏览器、微信内都能打开。

## 五、以后更新

改完代码后，一条命令即可发新版：

```bash
npm run deploy
```

（脚本对 `assets/*` 设了长缓存、`index.html` 不缓存，所以发版后刷新即生效。）

---

## 常见问题

- **微信里还是打不开？** 99% 是域名没备案、或访问的是未备案的 COS 默认地址。务必用**已备案的自定义域名**访问。
- **HTTPS 必需吗？** 微信里强烈建议 HTTPS；用免费证书即可。
- **页面 404 / 资源加载不出来？** 确认「静态网站」已开启、索引文档为 `index.html`。
  关于资源路径：GitHub Pages 用子路径 `/meow-catch/`，而 COS 在域名根目录——`npm run deploy` 已自动用 `base=/` 重新构建，无需手动改 `vite.config.js`。
