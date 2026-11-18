# vantaxgame.com 总站需求（交给 Grok）

Kevin：vantaxgame.com 是我们所有官网和游戏的集合站，**以后每个游戏都会在这里发布一份**。

## 部署
- 仓库 `dinghai87-lgtm/Game`（main），总站源码在 `vantax/` 目录。
- 构建：`sh vantax/build.sh`，输出 `dist/`；根目录是总站首页，游戏放在子路径（现在有 `/hero-defense/`）。
- 用 Cloudflare Pages（单独建一个项目，别和 eleronzentechnology.com 混用），绑定 `vantaxgame.com` 和 `www.vantaxgame.com`（www 301 到主域名），HTTPS，push 后自动更新（同 eleronzen 那套：拉不到 webhook 就每 5 分钟检查一次）。
- Kevin 已同意为 vantaxgame.com 加 Pages 需要的 DNS 记录；**只加 apex / www**，不要动 MX、TXT 等邮箱和验证记录，也不要动 vantaxgame.com 下其他已有子域名（例如之前 unitypay / Vantax Pay 相关的）。发现冲突先停下问 Kevin。不买服务器。
- 缓存规则沿用 `vantax/_headers`。

## 首页内容（需要你设计实现 `vantax/index.html`，现在只是占位）
- 品牌：**万泰游戏 · VANTAX GAMES**（英文界面不出现中文），研发商「万泰游戏开发 / Wantai Game Development」。
- 游戏列表（卡片网格，以后会越来越多，做成好加新游戏的结构）：
  - **Hero Defense / 英雄塔防** — 已上线，链接 `/hero-defense/`，素材 `img/ui_logo_full.webp`、`img/en_1_battle.webp`、`img/zh_1_battle.webp`、`img/icon.webp`
  - **LuckyVault** — Kevin 已确认上线（2026-11-18），链接 `/luckyvault/`（社交娱乐场：老虎机 + 桌游，虚拟币，仅供娱乐，18+，金币没有现金价值），素材 `img/luckyvault_hero.webp`、`img/luckyvault_icon.png`；卡片上标 18+ 和「仅供娱乐 · For entertainment only」
  - 其他游戏（万泰扑克 VANTAX POKER 等）先做「即将推出」卡片，Kevin 确认后再放上线
- 旗下官网入口：ELERONZEN TECHNOLOGY INC → https://eleronzentechnology.com/
- 页脚：© 2026 Wantai Game Development / ELERONZEN TECHNOLOGY INC；联系 info@eleronzentechnology.com；隐私 / 条款链接到 `/hero-defense/privacy.html`、`/hero-defense/terms.html`
- 中英双语切换（默认跟随浏览器语言），手机 / 平板 / 笔电 / 1920 / 2K 都要好看，图片不变形，不依赖外部 CDN。

做完推 main、部署后，把地址和截图发给 Kevin 确认。
