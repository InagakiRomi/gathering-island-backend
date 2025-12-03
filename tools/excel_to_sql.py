import os
import pandas as pd
from datetime import datetime

# 以程式所在路徑為基準
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "../data")
OUTPUT_DIR = os.path.join(BASE_DIR, "../database/sql")

def escape_sql(value):
    if pd.isna(value):
        return 'NULL'
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.upper() == "UUID()":
            return "UUID()"  # 不加引號
        return "'" + stripped.replace("'", "''") + "'"
    if isinstance(value, (datetime, pd.Timestamp)):
        return "'" + value.strftime('%Y-%m-%d %H:%M:%S') + "'"
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    return str(value)

def df_to_insert_sql(df, table_name):
    columns = df.columns.tolist()
    insert_sql = f"INSERT INTO `{table_name}` \n({', '.join(columns)}) VALUES\n"
    values_list = []
    for _, row in df.iterrows():
        values = [escape_sql(row[col]) for col in columns]
        values_list.append(f"({', '.join(values)})")
    return insert_sql + ",\n".join(values_list) + ";"

def main():
    # Debug print
    print(f"資料來源資料夾：{DATA_DIR}")
    print(f"SQL 輸出資料夾：{OUTPUT_DIR}\n")

    # 確保輸出資料夾存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.xlsx'):
            filepath = os.path.join(DATA_DIR, filename)
            print(f'讀取檔案：{filepath}')
            
            df = pd.read_excel(filepath, header=1)
            table_name = os.path.splitext(filename)[0]
            sql = df_to_insert_sql(df, table_name)
            
            output_filename = f"{table_name}.sql"
            output_path = os.path.join(OUTPUT_DIR, output_filename)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(sql + '\n')

            print(f'✅ SQL 已匯出至：{output_path}\n')

if __name__ == '__main__':
    main()
    input("👉 按任意鍵退出...")
