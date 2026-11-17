# 云端部署 Cloud deploy

© 2026 万泰游戏开发 Wantai Game Development

需要：一台 Linux 云服务器（2 核 2G 起，阿里云 / 腾讯云 / AWS 都可以）、已安装 Docker、一个域名。

1. 域名解析：添加 A 记录，指向服务器公网 IP。
2. 上传：把整个 `LuckyVault` 文件夹传到服务器（例如 `/opt/luckyvault`）。
3. 配置：`cd /opt/luckyvault/deploy && cp .env.example .env`，编辑 `.env` 填 `DOMAIN` 和 `ADMIN_PASS`。
4. 启动：`docker compose up -d --build`
5. 打开 `https://你的域名`（玩家）和 `https://你的域名/admin`（后台）。HTTPS 证书自动申请、自动续期。

更新版本：上传新文件后 `docker compose up -d --build`；数据在 Docker 卷 `lvdata` 里，不会丢。
备份：`docker compose exec app ls data/backups`（服务器每 6 小时自动备份一次）。
迁移现有数据：把 Windows 上的 `data\` 文件夹内容复制进卷：`docker compose cp ../data/. app:/app/data/` 然后 `docker compose restart app`。
