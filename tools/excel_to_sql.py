import os
import pandas as pd
from datetime import datetime

DATA_DIR = '../data'
OUTPUT_DIR = '../backend/src/database/sql'
OUTPUT_FILE = 'data.sql'

def escape_sql(value):
    if pd.isna(value):
        return 'NULL'
    if isinstance(value, str):
        return "'" + value.replace("'", "''") + "'"
    if isinstance(value, (datetime, pd.Timestamp)):
        return "'" + value.strftime('%Y-%m-%d %H:%M:%S') + "'"
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    return str(value)

def df_to_insert_sql(df, table_name):
    columns = df.columns.tolist()
    insert_sql = f"INSERT INTO {table_name} \n({', '.join(columns)}) VALUES\n"
    values_list = []
    for _, row in df.iterrows():
        values = [escape_sql(row[col]) for col in columns]
        values_list.append(f"({', '.join(values)})")
    return insert_sql + ",\n".join(values_list) + ";"

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    all_statements = []

    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.xlsx'):
            filepath = os.path.join(DATA_DIR, filename)
            print(f'讀取檔案：{filepath}')
            # 從第 2 行開始讀（跳過 index 0 的那一行）
            df = pd.read_excel(filepath, header=1)
            table_name = os.path.splitext(filename)[0]
            sql = df_to_insert_sql(df, table_name)
            all_statements.append(sql)

    output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILE)
    with open(output_path, 'w', encoding='utf-8') as f:
        for stmt in all_statements:
            f.write(stmt + '\n\n')

    print(f'SQL 已匯出至 {output_path}')

if __name__ == '__main__':
    main()
