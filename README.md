# Gathering Island Backend

以 **NestJS + TypeScript** 打造的後端 API 服務，管理聚會、標籤與使用者系統，並整合 JWT 驗證與角色授權。

---

## 🧠 專案簡介

本專案為聚會平台核心後端，涵蓋以下功能：

- 聚會與標籤管理
- 使用者系統、角色權限控制
- JWT 登入與授權
- 統一 API 回應格式
- 資料庫 schema 與版本控管（MikroORM）

架構模組化、分層清晰，適合中大型多人協作。

---

## 📘 API 文件（Swagger）

本專案提供完整的 Swagger API 文件，方便前後端協作與測試。

👉 [Swagger 連結](https://gathering-island.onrender.com/api)

---

## 🛠️ 技術架構

### 核心技術

- **NestJS**：模組化與 DI 框架
- **MikroORM**：資料庫存取與遷移機制（`mikro-orm.config.ts`）
- **JWT 驗證機制**：含自訂策略與角色授權控制

### 程式分層與資料設計

- 每個 module 含 controller / service / dto / entity
- DTO 使用 `class-validator` 驗證輸入
- Entity 強化 domain 邏輯表達
- 統一成功／錯誤輸出（interceptor + filter）

---

## 🔐 身分驗證與授權

- `JwtStrategy`：解析 JWT 與 payload
- `@Public()`：開放無需登入的路由
- `@Roles()` + `RolesGuard`：角色權限控管
- `JwtAuthGuard`：登入保護路由
- 支援 Cookie-based 或 Header-based token 回傳

---

## 🧩 模組與重要檔案

### 模組職責

| 模組         | 功能                             |
| ------------ | -------------------------------- |
| `auth`       | 登入 / 註冊 / JWT 驗證           |
| `gatherings` | 聚會 CRUD、查詢                  |
| `tags`       | 標籤 CRUD                        |
| `users`      | 使用者與角色管理                 |
| `common`     | 公用 decorator、guard、filter 等 |
| `config`     | 設定管理、環境變數驗證           |
| `migrations` | 資料庫版本控管                   |

### 核心檔案

- `main.ts`：應用啟動
- `app.module.ts`：主模組註冊
- `mikro-orm.config.ts`：ORM 設定
- `migrations/`：資料庫版本紀錄

---

## 🗃️ 資料庫與遷移

透過 MikroORM 管理 schema，使用 `npx mikro-orm migration:up` 同步版本，並支援多種 SQL 資料庫。

---

## 🛡️ 安全性設計

- 環境變數隔離敏感資訊
- 支援 secure / httpOnly cookies
- DTO 驗證防止惡意輸入
- 採用角色機制防止未授權存取
