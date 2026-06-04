import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 项目站点部署在 /<repo>/ 子路径下，
// 故生产构建用 '/meow-catch/'，本地开发仍用 '/'。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/meow-catch/' : '/',
  plugins: [vue()],
  server: {
    port: 5180,
    open: true,
  },
}))
