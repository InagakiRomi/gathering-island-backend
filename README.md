# Gathering Island Backend

可以舉辦和報名參加聚會活動的網頁平台，以 **NestJS + TypeScript** 實作，提供 JWT 雙 Token 驗證、排程任務、Excel 匯入驗證等功能。

- API 文件：[Swagger](https://gathering-island.onrender.com/api)

---

## 主要功能

| 類別       | 說明                                                     |
| ---------- | -------------------------------------------------------- |
| 身分驗證   | JWT Access + Refresh Token，支援 Cookie 或 Header 回傳   |
| 排程任務   | 透過 `@nestjs/schedule` 每 5 分鐘更新聚會狀態            |
| Excel 匯入 | `.xlsx` 檔案上傳，自訂 Pipe 解析，`class-validator` 驗證 |
| 查詢       | 分頁、排序、多條件篩選（狀態、類型、標籤、關鍵字）       |
| 軟刪除     | 封存與恢復                                               |
| API 回傳   | 統一成功與錯誤回應格式（Interceptor + Filter）           |

---

## 技術棧

- **NestJS**、**MikroORM**、**SQLite**：後端與資料庫
- **Passport + passport-jwt**：JWT 驗證
- **bcrypt**：密碼雜湊
- **class-validator + class-transformer**：DTO 驗證
- **Joi**：環境變數驗證（`@nestjs/config`）
- **@nestjs/swagger**：API 文件
- **@nestjs/schedule**：Cron 排程
- **xlsx**：Excel 解析
- **dayjs**：日期處理
- **Jest**、**supertest**：測試

---

## 身分驗證

- `@Public()`：標記無需登入的公開路由（如登入、註冊）
- `@Roles('admin')`：角色權限控管
- `@GetUser()`：取得目前登入的使用者
- 雙 Token 機制（Access + Refresh），支援 Cookie 或 Header 回傳

---

## 模組

| 模組       | 功能                                           |
| ---------- | ---------------------------------------------- |
| auth       | 註冊、登入、登出、Refresh Token                |
| gatherings | CRUD、報名與取消、軟刪除與恢復、Excel 格式檢查 |
| tags       | 標籤 CRUD                                      |
| users      | 使用者與角色                                   |

---

## 快速開始

```bash
cd backend
npm install
npm run start:dev
```

資料庫遷移與環境變數設定請參閱 [backend/README.md](backend/README.md)。
