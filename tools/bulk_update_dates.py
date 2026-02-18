import os
import sys

import pandas as pd

# 欄位名（只讀第二行標題）
GATHERING_ID_ALIASES = ("id",)
PARTICIPANT_GATHERING_ALIASES = ("gatheringId", "gathering")
PARTICIPANT_JOINED_AT_ALIASES = ("joinedAt",)


def _normalize_columns(df):
    """將欄位名去除前後空白。"""
    return df.rename(columns=lambda c: c.strip() if isinstance(c, str) else c)


def _resolve_column(df, aliases):
    """從 DataFrame 的欄位中找出第一個符合別名列表的欄位名。"""
    cols = set(df.columns)
    for alias in aliases:
        if alias in cols:
            return alias
    raise KeyError(f"找不到欄位（預期其中之一）：{aliases}。實際欄位：{list(df.columns)}")


def _datetime_to_str(ser):
    """將 datetime 序列轉成 Excel 用的文字（YYYY-MM-DD HH:mm:ss），NaT 維持空字串。"""
    return ser.apply(lambda x: x.strftime("%Y-%m-%d %H:%M:%S") if pd.notna(x) and hasattr(x, "strftime") else "")


try:
    year_offset = int(input("請輸入要增加或減少的年數（例如 1 或 -1）："))
except ValueError:
    print("請輸入整數！")
    input("按 Enter 結束...")
    sys.exit()

gathering_path = os.path.join(os.path.dirname(__file__), "..", "data", "Gathering.xlsx")
participant_path = os.path.join(os.path.dirname(__file__), "..", "data", "Participant.xlsx")
output_gathering = os.path.join(os.path.dirname(__file__), "..", "data", "Gathering_updated.xlsx")
output_participant = os.path.join(os.path.dirname(__file__), "..", "data", "Participant_updated.xlsx")

for path, name in [(gathering_path, "Gathering.xlsx"), (participant_path, "Participant.xlsx")]:
    if not os.path.exists(path):
        print("找不到檔案：", path)
        input("按 Enter 結束...")
        sys.exit()

print("讀取 Gathering 檔案中...")

# 跳過第一行（中文說明），第二行當標題
df = _normalize_columns(pd.read_excel(gathering_path, skiprows=[0], header=0))

date_columns = ["startTime", "deadline", "createdAt", "updatedAt"]

for col in date_columns:
    if col in df.columns:
        df[col] = pd.to_datetime(df[col], errors="coerce")
        df[col] = df[col] + pd.DateOffset(years=year_offset)

# --- 處理 Participant：joinedAt 落在對應活動的 createdAt～deadline，同活動按時間排序（需先用 df 的 datetime 算完再轉文字）---
print("讀取 Participant 檔案中...")
df_p = _normalize_columns(pd.read_excel(participant_path, skiprows=[0], header=0))

g_id_col = _resolve_column(df, GATHERING_ID_ALIASES)
col_gathering = _resolve_column(df_p, PARTICIPANT_GATHERING_ALIASES)
col_joined_at = _resolve_column(df_p, PARTICIPANT_JOINED_AT_ALIASES)

# 活動 id -> (createdAt, deadline)，使用已調整過年份的 Gathering
df[g_id_col] = df[g_id_col].astype(object)
gathering_dates = {}
for _, row in df.iterrows():
    gid = row[g_id_col]
    if pd.notna(row.get("createdAt")) and pd.notna(row.get("deadline")):
        gathering_dates[gid] = (row["createdAt"], row["deadline"])

# 轉成 datetime 以便後續排序與寫回
df_p[col_joined_at] = pd.to_datetime(df_p[col_joined_at], errors="coerce")

# 依 gathering 分組，同一活動內依序分配 joinedAt（在 createdAt～deadline 之間、按時間順序）
for gid, grp in df_p.groupby(col_gathering, sort=False):
    if gid not in gathering_dates:
        continue
    created, deadline = gathering_dates[gid]
    if pd.isna(created) or pd.isna(deadline) or created >= deadline:
        continue
    n = len(grp)
    # 在 (created, deadline) 之間均勻取 n 個時間點，依序對應參與者
    delta = (deadline - created) / (n + 1)
    for i, idx in enumerate(grp.index):
        df_p.at[idx, col_joined_at] = created + delta * (i + 1)

# 先依活動、再依 joinedAt 排序（同活動按時間順序）
df_p = df_p.sort_values(by=[col_gathering, col_joined_at]).reset_index(drop=True)

# joinedAt 轉成文字再匯出，Excel 內為文字格式
df_p[col_joined_at] = _datetime_to_str(df_p[col_joined_at])

try:
    df_p.to_excel(output_participant, index=False)
    print("Participant 已輸出：", output_participant)
except PermissionError:
    print("無法寫入 Participant_updated.xlsx，請先關閉該檔案（若在 Excel 中開啟請關閉後重試）。")
    input("按 Enter 結束...")
    sys.exit(1)

# 日期欄位轉成文字再匯出 Gathering，Excel 內為文字格式
for col in date_columns:
    if col in df.columns:
        df[col] = _datetime_to_str(df[col])
try:
    df.to_excel(output_gathering, index=False)
    print("Gathering 已輸出：", output_gathering)
except PermissionError:
    print("無法寫入 Gathering_updated.xlsx，請先關閉該檔案（若在 Excel 中開啟請關閉後重試）。")
    input("按 Enter 結束...")
    sys.exit(1)

print("完成！")
input("按 Enter 結束...")
