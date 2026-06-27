"""
Data Exploration & Quality Check
Team AntiGravity | Dataport Hackathon 2024
Run this FIRST before any preprocessing.
"""

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

CSV_PATH = r"c:\Users\birad\Downloads\AntiGravity\Datport\dataset\Pangyo_14days_lanes_w_arith_adj.csv"

print("=" * 65)
print("  STEP 1: LOADING DATASET")
print("=" * 65)

df = pd.read_csv(CSV_PATH)
print("Loaded successfully")
print(f"   Rows    : {len(df):,}")
print(f"   Columns : {len(df.columns)}")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 2: COLUMN NAMES & DTYPES")
print("=" * 65)
print(df.dtypes)

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 3: MISSING VALUES")
print("=" * 65)
missing = df.isnull().sum()
missing_pct = (missing / len(df) * 100).round(2)
missing_df = pd.DataFrame({'Missing Count': missing, 'Missing %': missing_pct})
missing_with_values = missing_df[missing_df['Missing Count'] > 0]
if missing_with_values.empty:
    print("[OK] No missing values found!")
else:
    print("[WARNING] Columns with missing values:")
    print(missing_with_values.to_string())

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 4: DUPLICATE ROWS")
print("=" * 65)
dupes = df.duplicated().sum()
print(f"Duplicate rows: {dupes:,}")
if dupes > 0:
    print("[WARNING] Duplicates found! Will be dropped in preprocessing.")
else:
    print("[OK] No duplicates found!")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 5: UNIQUE VALUES IN KEY COLUMNS")
print("=" * 65)
print(f"Unique LINK_IDs  : {df['LINK_ID'].nunique()} -> {sorted(df['LINK_ID'].unique())}")
print(f"Unique DAY values: {sorted(df['DAY'].unique())} (1=Mon ... 7=Sun)")
print(f"Date range       : {df['date'].min()} -> {df['date'].max()}")
print(f"TIMEINT samples  : {df['TIMEINT'].head(10).tolist()}")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 6: PARSE DATETIME")
print("=" * 65)
try:
    df['datetime'] = pd.to_datetime(df['date'])
    print("[OK] Datetime parsed successfully")
    print(f"   Min: {df['datetime'].min()}")
    print(f"   Max: {df['datetime'].max()}")
    print(f"   Total days: {(df['datetime'].max() - df['datetime'].min()).days + 1}")
except Exception as e:
    print(f"[ERROR] Datetime parse error: {e}")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 7: TIME CONTINUITY CHECK (per LINK_ID)")
print("=" * 65)
df_sorted = df.sort_values(['LINK_ID', 'datetime'])
gaps_found = 0
for link_id, group in df_sorted.groupby('LINK_ID'):
    times = group['datetime'].sort_values()
    diffs = times.diff().dropna()
    unexpected = diffs[diffs != pd.Timedelta(minutes=5)]
    if len(unexpected) > 0:
        gaps_found += len(unexpected)
        print(f"  [WARNING] Link {link_id}: {len(unexpected)} irregular intervals")
        print(f"       Most common gap : {diffs.mode()[0]}")
        print(f"       Irregular sample: {unexpected.head(2).values}")
if gaps_found == 0:
    print("[OK] All time intervals are exactly 5 minutes — no gaps!")
else:
    print(f"\n[WARNING] Total irregular intervals found: {gaps_found}")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 8: SPEED ANALYSIS (per lane)")
print("=" * 65)
speed_cols_arith = [c for c in df.columns if 'SPEEDAVGARITH' in c]
speed_cols_harm  = [c for c in df.columns if 'SPEEDAVGHARM'  in c]

for col in speed_cols_arith + speed_cols_harm:
    s = df[col]
    zeros     = (s == 0).sum()
    negatives = (s < 0).sum()
    over_300  = (s > 300).sum()
    print(f"  {col:35s} | min={s.min():7.2f} | max={s.max():7.2f} | zeros={zeros:5} | neg={negatives:3} | >300={over_300:3}")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 9: QUEUE DELAY ANALYSIS (per lane)")
print("=" * 65)
delay_cols = [c for c in df.columns if 'QUEUEDELAY' in c]
for col in delay_cols:
    s = df[col]
    negatives = (s < 0).sum()
    over_1000 = (s > 1000).sum()
    print(f"  {col:35s} | min={s.min():8.2f} | max={s.max():8.2f} | neg={negatives:3} | >1000s={over_1000:4}")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 10: OCCUPANCY RATE ANALYSIS (per lane)")
print("=" * 65)
occup_cols = [c for c in df.columns if 'OCCUPRATE' in c]
for col in occup_cols:
    s = df[col]
    negatives  = (s < 0).sum()
    over_cap   = (s > 1.0).sum()
    pct        = round(over_cap / len(df) * 100, 2)
    print(f"  {col:30s} | min={s.min():.4f} | max={s.max():.4f} | neg={negatives:3} | >1.0={over_cap:5} ({pct}%)")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 11: VEHICLE COUNT ANALYSIS (per lane)")
print("=" * 65)
vehs_cols = [c for c in df.columns if 'VEHS' in c]
for col in vehs_cols:
    s = df[col]
    zeros     = (s == 0).sum()
    negatives = (s < 0).sum()
    print(f"  {col:25s} | min={s.min():6.1f} | max={s.max():6.1f} | zeros={zeros:6} | neg={negatives:3}")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 12: LANE 6 ACTIVITY CHECK")
print("=" * 65)
lane6_active = df[df['VEHS(ALL)_6'] > 0]
lane6_zero   = df[df['VEHS(ALL)_6'] == 0]
print(f"Lane 6 rows with VEHS > 0 : {len(lane6_active):,}  ({round(len(lane6_active)/len(df)*100,2)}%)")
print(f"Lane 6 rows with VEHS = 0 : {len(lane6_zero):,}  ({round(len(lane6_zero)/len(df)*100,2)}%)")
if len(lane6_active) > 0:
    print(f"When Lane 6 IS active:")
    print(f"  Avg speed    : {lane6_active['SPEEDAVGHARM(ALL)_6'].mean():.2f} km/h")
    print(f"  Avg delay    : {lane6_active['QUEUEDELAY(ALL)_6'].mean():.2f} s")
    print(f"  Avg vehicles : {lane6_active['VEHS(ALL)_6'].mean():.2f}")
    print(f"  Unique Links : {lane6_active['LINK_ID'].nunique()}")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 13: HARMONIC vs ARITHMETIC — INVERSION CHECK")
print("=" * 65)
print("(Harmonic mean should always be <= Arithmetic mean. Inversions = bad data)")
for i in range(1, 7):
    a_col = f'SPEEDAVGARITH(ALL)_{i}'
    h_col = f'SPEEDAVGHARM(ALL)_{i}'
    inversions = (df[h_col] > df[a_col]).sum()
    non_zero   = (df[a_col] > 0).sum()
    pct        = round(inversions / max(non_zero, 1) * 100, 3)
    print(f"  Lane {i}: {inversions:5} inversions / {non_zero:,} non-zero rows ({pct}%)")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 14: ROWS PER DAY (expected = 288 × 65 = 18,720 per day)")
print("=" * 65)
df['date_only'] = pd.to_datetime(df['date']).dt.date
rows_per_day = df.groupby('date_only').size()
expected = 288 * df['LINK_ID'].nunique()
print(f"Expected rows per day: {expected:,}")
for day, count in rows_per_day.items():
    flag = "[OK]" if count == expected else "[WARNING]"
    print(f"  {flag} {day} : {count:,} rows")

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  STEP 15: DESCRIPTIVE STATS — Key Columns")
print("=" * 65)
key_cols = [
    'VEHS(ALL)_1',         'SPEEDAVGHARM(ALL)_1',
    'QUEUEDELAY(ALL)_1',   'OCCUPRATE(ALL)_1',
    'VEHS(ALL)_6',         'SPEEDAVGHARM(ALL)_6',
    'QUEUEDELAY(ALL)_6',   'OCCUPRATE(ALL)_6',
]
print(df[key_cols].describe().round(3).to_string())

# ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  EXPLORATION COMPLETE")
print("=" * 65)
print("""
Review the output above and check:
 1. Missing values?           -> Will impute / drop in preprocess.py
 2. Duplicate rows?           -> Will drop
 3. Speed inversions?         -> Will flag and cap
 4. Negative speeds/counts?   -> Will zero-floor
 5. Time gaps per link?       -> Will forward-fill if <= 2 intervals
 6. Lane 6 % active?          -> Will use as 'extreme_congestion_flag'
 7. Over-capacity occupancy?  -> Will keep (valid signal for ARS)
 8. Rows per day consistent?  -> Investigate anomalies
""")
