import pandas as pd
import os
import sys

try:
    year_offset = int(input("請輸入要增加或減少的年數（例如 1 或 -1）："))
except ValueError:
    print("請輸入整數！")
    input("按 Enter 結束...")
    sys.exit()

file_path = "../data/Gathering.xlsx"
output_file = "../data/Gathering_updated.xlsx"

if not os.path.exists(file_path):
    print("找不到檔案：", file_path)
    input("按 Enter 結束...")
    sys.exit()

print("讀取檔案中...")

# 標題在第二行
df = pd.read_excel(file_path, header=1)

date_columns = ["startTime", "deadline", "createdAt", "updatedAt"]

for col in date_columns:
    if col in df.columns:
        # 轉成 datetime
        df[col] = pd.to_datetime(df[col], errors="coerce")

        # ✅ 向量化年份調整
        df[col] = df[col] + pd.DateOffset(years=year_offset)

# 輸出新檔案
df.to_excel(output_file, index=False)

print("完成！")
print("輸出檔案：", output_file)
input("按 Enter 結束...")
