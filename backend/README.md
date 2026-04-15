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

### 6. 手動全量更新聚會狀態

```bash
npm run check:gathering-status:all
```

---

## 更新資料庫

如果只是要更新資料庫（不需要重新建立 migration），只需要執行以下步驟：

### 1. 刪除現有 SQLite 資料庫（如有）

```bash
rm -f data/gathering.db
```

### 2. 執行 migration，建立資料表

```bash
npx mikro-orm migration:up
```

### 3. 初始化預設資料

```bash
npm run init:db
```

---

## 更新資料庫日期

當需要將活動整體年份往後或往前調整時，可依照以下流程操作：

### 1. 啟動年份批次調整工具

在 `tools` 資料夾中執行：

```bash
python update_year.py
```

### 2. 將新檔案的日期覆蓋回原始檔案

### 3. 更新資料庫

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
