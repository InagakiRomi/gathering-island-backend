## 快速開始

### 1. 建立環境變數檔案

### 2. 安裝依賴

```bash
npm install
```

### 3. 啟動應用程式

```bash
npm run start:dev
```

---

## 使用 MikroORM Migration 初始化資料庫

### 1. 刪除現有 migration（如有）

```bash
rm -rf migrations
```

### 2. 刪除現有 SQLite 資料庫（如有）

```bash
rm -f data/gathering.db
```

### 3. 建立初始 migration

```bash
npx mikro-orm migration:create --initial
```

### 4. 執行 migration，建立資料表

```bash
npx mikro-orm migration:up
```

### 5. 初始化預設資料

```bash
npm run init:db
```

---

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
DB_NAME=data/gathering.db
JWT_ACCESS_SECRET=your-production-secret-key
JWT_REFRESH_SECRET=your-production-secret-key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
JWT_COOKIE_SECRET=your-production-cookie-secret
```

---

### Q: 如何備份 SQLite 資料庫？

A: 直接複製 `data/gathering.db` 檔案即可。
