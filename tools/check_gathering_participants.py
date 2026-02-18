import argparse
import sys
from pathlib import Path

import pandas as pd


# Excel 欄位對照（第二行為標題列，支援英文或「中文+英文」）
GATHERING_ID_ALIASES = ("id", "主鍵 id")
GATHERING_CREATOR_ALIASES = ("userId", "擁有者 id")
GATHERING_TITLE_ALIASES = ("title", "標題")
PARTICIPANT_GATHERING_ALIASES = ("gatheringId", "對應gatheringId", "gathering")
PARTICIPANT_USER_ALIASES = ("userId", "對應userId", "user")
PARTICIPANT_JOINED_AT_ALIASES = ("joinedAt", "加入時間")

# 預設 Excel 路徑：與 tools 慣例一致，從 repo 的 data 資料夾讀取
_DATA_DIR = Path(__file__).resolve().parent / ".." / "data"
DEFAULT_GATHERING_PATH = _DATA_DIR / "Gathering.xlsx"
DEFAULT_PARTICIPANT_PATH = _DATA_DIR / "Participant.xlsx"


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """將欄位名去除前後空白，避免匯出時多出空格造成 KeyError。"""
    df = df.rename(columns=lambda c: c.strip() if isinstance(c, str) else c)
    return df


def _resolve_column(df: pd.DataFrame, aliases: tuple[str, ...]) -> str:
    """從 DataFrame 的欄位中找出第一個符合別名列表的欄位名。"""
    cols = set(df.columns)
    for alias in aliases:
        if alias in cols:
            return alias
    raise KeyError(
        f"Excel 找不到欄位（預期其中之一）：{aliases}。實際欄位：{list(df.columns)}"
    )


def check_creator_signup(
    gathering_path: str | Path,
    participant_path: str | Path,
) -> dict:
    """
    檢查建立者是否誤報名自己的活動。

    Returns:
        包含 found、total、violations 的 dict
    """
    # 標題在第二行（header=1），與其他 tools / 匯入格式一致
    df_gatherings = _normalize_columns(pd.read_excel(gathering_path, header=1))
    df_participants = _normalize_columns(pd.read_excel(participant_path, header=1))

    # 解析實際欄位名（支援英文或「中文+英文」匯出）
    g_id = _resolve_column(df_gatherings, GATHERING_ID_ALIASES)
    g_creator = _resolve_column(df_gatherings, GATHERING_CREATOR_ALIASES)
    g_title = _resolve_column(df_gatherings, GATHERING_TITLE_ALIASES)
    col_gathering = _resolve_column(df_participants, PARTICIPANT_GATHERING_ALIASES)
    col_user = _resolve_column(df_participants, PARTICIPANT_USER_ALIASES)
    col_joined_at = _resolve_column(df_participants, PARTICIPANT_JOINED_AT_ALIASES)

    # 活動 id -> 建立者 userId
    gathering_creators = df_gatherings.set_index(g_id)[g_creator].to_dict()

    violations = []
    for _, row in df_participants.iterrows():
        gathering_id = row[col_gathering]
        participant_user_id = row[col_user]
        creator_id = gathering_creators.get(gathering_id)

        if creator_id is not None and participant_user_id == creator_id:
            gathering_row = df_gatherings[df_gatherings[g_id] == gathering_id].iloc[0]
            violations.append(
                {
                    "gatheringId": int(gathering_id),
                    "userId": int(participant_user_id),
                    "title": str(gathering_row.get(g_title, "")),
                    "joinedAt": str(row.get(col_joined_at, "")),
                }
            )

    return {
        "found": len(violations) > 0,
        "total": len(violations),
        "violations": violations,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="檢查活動建立者是否誤報名自己的活動")
    parser.add_argument(
        "--gathering",
        type=Path,
        default=DEFAULT_GATHERING_PATH,
        help="活動 Excel 檔案路徑（預設: ../data/Gathering.xlsx）",
    )
    parser.add_argument(
        "--participant",
        type=Path,
        default=DEFAULT_PARTICIPANT_PATH,
        help="參與者 Excel 檔案路徑（預設: ../data/Participant.xlsx）",
    )
    args = parser.parse_args()

    # 解析為絕對路徑，方便錯誤訊息與讀取
    gathering_path = args.gathering.resolve()
    participant_path = args.participant.resolve()

    for path in [gathering_path, participant_path]:
        if not path.exists():
            print(f"錯誤：找不到檔案 {path}")
            input("按 Enter 結束...")
            return

    result = check_creator_signup(gathering_path, participant_path)

    if result["found"]:
        print(f"[!] 發現 {result['total']} 筆建立者誤報名：\n")
        for i, v in enumerate(result["violations"], 1):
            print(f"  {i}. 活動 ID: {v['gatheringId']}, 標題: {v['title']}")
            print(f"     建立者 userId {v['userId']} 出現在參與者名單中（加入時間: {v['joinedAt']})")
            print()
        input("按 Enter 結束...")
        sys.exit(1)
    else:
        print("[OK] 檢查通過，無建立者誤報名的情況")
        input("按 Enter 結束...")
        sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        input("按 Enter 結束...")
        raise
