import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';

// 資料庫路徑
const dbPath = path.resolve(__dirname, '../data/gathering.db');
// SQL 資料夾
const sqlDir = path.resolve(__dirname, '../database');

// 如果資料夾不存在就建立
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// 連接資料庫
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('無法連接資料庫：', err.message);
    process.exit(1);
  }

  console.log('資料庫連線成功');

  // 讀取所有 .sql 檔案（按順序）
  const files = fs
    .readdirSync(sqlDir)
    .filter((file) => file.endsWith('.sql'))
    .sort(); // 確保有序執行（例如 01_XXX.sql, 02_YYY.sql）

  let total = files.length;
  let count = 0;

  function runNext() {
    if (count >= total) {
      console.log('所有 SQL 檔案執行完成');
      return db.close();
    }

    const file = files[count];
    const fullPath = path.join(sqlDir, file);
    const sql = fs.readFileSync(fullPath, 'utf-8');

    console.log(`執行 SQL 檔案: ${file}`);
    db.exec(sql, (err) => {
      if (err) {
        console.error(`執行 ${file} 發生錯誤：`, err.message);
        return db.close();
      }

      console.log(`完成: ${file}`);
      count++;
      runNext(); // 遞迴執行下一個
    });
  }

  runNext();
});
