# 官网主页重做需求（交给 Grok）

Kevin 觉得现在的主页 UI 不够好，请你重新设计并实现 **eleronzentechnology.com 主页**。

## 范围
- 只改仓库 `dinghai87-lgtm/Game` 的 `site/` 目录（主页源码）。`hero-defense/` 是游戏本体，**不要动**。
- 构建方式不变：`sh site/build.sh` → `dist/`，根目录 = 官网，`/hero-defense/` = 游戏。
- 不买服务器、不改 DNS；需要的话先问 Kevin。

## 必须保留的内容
- 公司：ELERONZEN TECHNOLOGY INC，游戏发行商；游戏由「万泰游戏开发 / Wantai Game Development (Vantax)」研发。
- 主打游戏：Hero Defense / 英雄塔防（塔防、策略、免费、Web · iOS · Android，iOS/Android 即将上线）。「立即游玩」按钮链接到 `/hero-defense/`。
- 联系邮箱：info@eleronzentechnology.com
- 地址：2227 Prairie Center Pkwy, Num D, Brighton, CO 80601, USA
- 页脚链接：`/hero-defense/privacy.html`、`/hero-defense/terms.html`、`/hero-defense/odds.html`；© 2026 ELERONZEN TECHNOLOGY INC。
- 中英双语切换（默认跟随浏览器语言）。英文界面不出现中文，中文名「英雄塔防」只在中文界面出现。

## 可用素材（site/img/）
- `ui_logo_full.webp`（800×320，横版 logo，注意保持比例别拉伸）、`ui_logo_emblem.webp`（盾牌徽标）
- 游戏截图：`en_1_battle / en_2_map / en_3_heroes` 和对应 `zh_` 版本（webp，战斗图 1600 宽）
- `feature_en.webp`（1024×500 宣传图）、`icon.webp`、`favicon.png`、`apple-touch-icon.png`
- 品牌色：深色底 + 金色 #d8a838

## 质量要求
- 参考一线游戏发行商官网的版式（大气、留白、首屏有游戏大图）。
- 手机 / 平板 / 1260 宽笔电 / 1920 / 2K 都要好看，无横向滚动、图片不变形。
- 单个 index.html + img/，不依赖外部 CDN（国内也要能打开）；缓存规则保留 `site/_headers`。
- 做完推到 main，部署后把地址和截图发给 Kevin 确认。
