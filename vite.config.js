import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 说明：
// - GitHub Pages 项目站点在 /<repo>/ 子路径下 → 生产默认 '/meow-catch/'
// - 腾讯云 COS 等放在域名根目录 → 部署脚本会设 DEPLOY_BASE='/' 覆盖
// - 本地开发始终 '/'
export default defineConfig(({ command }) => ({
  base: process.env.DEPLOY_BASE || (command === 'build' ? '/meow-catch/' : '/'),
  plugins: [vue()],
  server: {
    port: 5180,
    open: true,
  },
}))
