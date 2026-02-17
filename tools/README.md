# Excel to SQL 匯出工具

功能如下：

- 從 `../data` 資料夾中讀取所有 `.xlsx` 格式的 Excel 檔案
- 將資料轉換為 SQL `INSERT INTO` 語句
- 輸出個別的 `sql` 檔案

## 🔧 使用說明

1. 修改 ../data 資料夾中的 Excel 檔案內容

   > （請確保每個 Excel 檔的欄位一致，且符合資料表結構）

2. 儲存完成後，執行此檔案：excel_to_sql.py

3. 系統會自動產出 sql 檔案

---

# Excel 年份批次調整工具

功能如下：

- 從 `../data` 資料夾讀取 `Gathering.xlsx`
- 將原本的日期欄位**批次增加或減少年份**
- 影響欄位：
  - `startTime`
  - `deadline`
  - `createdAt`
  - `updatedAt`
- 輸出新的 `Gathering_updated.xlsx` 檔案

## 🔧 使用說明

1. 修改 `../data/Gathering.xlsx` 內的資料

   > （請確保標題在第二行，且日期格式為 `YYYY-MM-DD HH:mm:ss`）

2. 儲存完成後，執行此檔案：update_year.py

3. 依提示輸入要增加或減少的年數
   - 輸入 `1` → 所有指定日期 +1 年
   - 輸入 `-1` → 所有指定日期 -1 年

4. 系統會自動產出 `Gathering_updated.xlsx`
