## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 建 migration

```bash
npx mikro-orm migration:create
```

### 3. 套用/更新 migration

```bash
npx mikro-orm migration:up
```

### 4. 啟動應用程式

```bash
npm run start:dev
```

## 新增 `.sql` 檔案資料

```bash
npm run init:db
```

## 環境變數配置

### 開發環境 (`.env.stage.dev`)

```
PORT=3000
STAGE=dev
DB_NAME=data/gathering.db
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-secret-key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
JWT_COOKIE_SECRET=your-cookie-secret
```

### 生產環境 (`.env.stage.prod`)

```
PORT=3000
STAGE=prod
DB_NAME=/var/lib/gathering-island/gathering.db
JWT_ACCESS_SECRET=your-production-secret-key
JWT_REFRESH_SECRET=your-production-secret-key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
JWT_COOKIE_SECRET=your-production-cookie-secret
```

### Q: 如何備份 SQLite 資料庫？

A: 直接複製 `data/gathering.db` 檔案即可。
