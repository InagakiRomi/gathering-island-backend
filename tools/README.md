# Excel to SQL 匯出工具

功能如下：

- 從 `../data` 資料夾中讀取所有 `.xlsx` 格式的 Excel 檔案
- 將資料轉換為 SQL `INSERT INTO` 語句
- 輸出個別的 `sql` 檔案

---

## 🔧 使用說明

1. 修改 ../data 資料夾中的 Excel 檔案內容
   > （請確保每個 Excel 檔的欄位一致，且符合資料表結構）

2. 儲存完成後，執行此檔案：excel_to_sql.py

3. 系統會自動產出 sql 檔案