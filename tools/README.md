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

- 從 `../data` 讀取 `Gathering.xlsx`、`Participant.xlsx`
- **Gathering**：將日期欄位批次加減年數  
  影響欄位：`startTime`、`deadline`、`createdAt`、`updatedAt`
- **Participant**：將每筆的 `joinedAt` 設為對應活動的 `createdAt`～`deadline` 之間，同一活動的參與者依加入時間排序
- 輸出：`Gathering_updated.xlsx`、`Participant_updated.xlsx`

## 🔧 使用說明

1. 確認 `../data` 內有 `Gathering.xlsx`、`Participant.xlsx`（兩者皆需）

2. 執行：`bulk_update_dates.py`

3. 依提示輸入要增加或減少的年數（例如 `1` 或 `-1`）

4. 產出檔案會寫入 `../data/`：`Gathering_updated.xlsx`、`Participant_updated.xlsx`

---

# 檢查活動報名成員

功能如下：

- 從 `../data` 資料夾讀取 `Gathering.xlsx`、`Participant.xlsx`
- 檢查活動建立者是否誤報名自己的活動
- 違規會列出活動 ID、標題、userId、加入時間；無違規則顯示檢查通過

## 🔧 使用說明

1. 確認 `../data` 內有 `Gathering.xlsx`、`Participant.xlsx`

2. 儲存完成後，執行此檔案：check_gathering_participants.py

3. 依結果查看輸出，結束時按 Enter 關閉
