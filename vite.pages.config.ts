import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
// 独立静态入口：不依赖 Sites 服务、登录、数据库或服务器。
// 相对资源路径同时支持 username.github.io 和 username.github.io/repository/。
export default defineConfig({
 root:'portable',base:'./',publicDir:'../public',
 resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
 plugins:[{name:'relative-game-assets',enforce:'pre',transform(code,id){if(!id.includes('node_modules')&&/\.(tsx?|css)$/.test(id))return code.replaceAll('/images/','./images/');}},react()],
 build:{outDir:'../pages-dist',emptyOutDir:true},
});
