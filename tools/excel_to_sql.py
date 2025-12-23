import os
import pandas as pd
from datetime import datetime

# 以程式所在路徑為基準
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "../data")
OUTPUT_DIR = os.path.join(BASE_DIR, "../backend/database")


def escape_sql(value):
    """將 Python/Pandas 的資料轉成 PostgreSQL 可接受的格式"""
    if pd.isna(value):
        return "NULL"

    if isinstance(value, str):
        stripped = value.strip()

        # 特殊處理 UUID()
        if stripped.upper() == "UUID()":
            return "UUID()"

        # 一般字串 escape 單引號 → ''
        return "'" + stripped.replace("'", "''") + "'"

    if isinstance(value, (datetime, pd.Timestamp)):
        return "'" + value.strftime("%Y-%m-%d %H:%M:%S") + "'"

    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"

    # 數字、其他型態直接轉字串
    return str(value)


def pg_identifier(name: str) -> str:
    """
    PostgreSQL 識別字（表名/欄位名）強制加雙引號。
    不做任何判斷，永遠保護。
    """
    return f'"{name}"'


def df_to_insert_sql(df, table_name):
    """將 DataFrame 轉成 Postgre式的 INSERT INTO 語法"""

    table = pg_identifier(table_name)
    columns = [pg_identifier(col) for col in df.columns.tolist()]

    insert_sql = f"INSERT INTO {table}\n({', '.join(columns)}) VALUES\n"
    values_list = []

    for _, row in df.iterrows():
        values = [escape_sql(row[col]) for col in df.columns]
        values_list.append(f"({', '.join(values)})")

    return insert_sql + ",\n".join(values_list) + ";"


def main():
    print(f"資料來源資料夾：{DATA_DIR}")
    print(f"SQL 輸出資料夾：{OUTPUT_DIR}\n")

    # 確保輸出資料夾存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for filename in os.listdir(DATA_DIR):
        if filename.endswith(".xlsx"):
            filepath = os.path.join(DATA_DIR, filename)
            print(f"讀取檔案：{filepath}")

            # Excel 第二列為表頭 header=1（維持你原本設定）
            df = pd.read_excel(filepath, header=1)

            table_name = os.path.splitext(filename)[0]
            sql = df_to_insert_sql(df, table_name)

            output_filename = f"{table_name}.sql"
            output_path = os.path.join(OUTPUT_DIR, output_filename)

            with open(output_path, "w", encoding="utf-8") as f:
                f.write(sql + "\n")

            print(f"✅ SQL 已匯出至：{output_path}\n")


if __name__ == "__main__":
    main()
    input("👉 按任意鍵退出...")
