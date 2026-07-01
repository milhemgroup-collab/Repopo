"""Create or upgrade the Gmail assistant SQLite state database.

Idempotent: safe to run before every assistant run. Creates the database on
first use and migrates older schemas in place (v1 -> v2 adds audit columns;
existing rows are preserved).

Usage:
    python init_state.py <sqlite-path>            create or migrate
    python init_state.py <sqlite-path> --check    report schema state, change nothing
"""

import sqlite3
import sys
from pathlib import Path

SCHEMA_VERSION = 2

# Columns added in schema v2. ALTER TABLE ADD COLUMN is a no-op-safe,
# non-destructive migration path for v1 databases.
EMAIL_ACTIONS_V2_COLUMNS = [
    ("latest_message_hash", "TEXT"),
    ("thread_latest_ts", "TEXT"),
    ("proposed_reply", "TEXT"),
    ("action_taken", "TEXT"),
    ("skip_reason", "TEXT"),
    ("risk_level", "TEXT"),
    ("review_status", "TEXT"),
    ("query_stage", "TEXT"),
    ("prompt_version", "TEXT"),
]

RUN_HISTORY_V2_COLUMNS = [
    ("skipped_count", "INTEGER NOT NULL DEFAULT 0"),
    ("needs_review_count", "INTEGER NOT NULL DEFAULT 0"),
    ("reps_count", "INTEGER NOT NULL DEFAULT 0"),
    ("no_reply_count", "INTEGER NOT NULL DEFAULT 0"),
    ("config_version", "TEXT"),
    ("prompt_version", "TEXT"),
]


def ensure_base_schema(cur: sqlite3.Cursor) -> None:
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS email_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT NOT NULL UNIQUE,
            thread_id TEXT NOT NULL,
            received_at TEXT,
            sender TEXT,
            subject TEXT,
            classification TEXT,
            draft_created INTEGER NOT NULL DEFAULT 0,
            draft_id TEXT,
            labels_applied TEXT,
            confidence REAL,
            reason TEXT,
            digest_date TEXT,
            run_mode TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS run_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_started_at TEXT NOT NULL,
            run_finished_at TEXT,
            run_mode TEXT NOT NULL,
            candidate_count INTEGER NOT NULL DEFAULT 0,
            processed_count INTEGER NOT NULL DEFAULT 0,
            draft_count INTEGER NOT NULL DEFAULT 0,
            error_count INTEGER NOT NULL DEFAULT 0,
            notes TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
        """
    )


def table_columns(cur: sqlite3.Cursor, table: str) -> set:
    cur.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cur.fetchall()}


def add_missing_columns(cur: sqlite3.Cursor, table: str, columns) -> list:
    existing = table_columns(cur, table)
    added = []
    for name, decl in columns:
        if name not in existing:
            cur.execute(f"ALTER TABLE {table} ADD COLUMN {name} {decl}")
            added.append(name)
    return added


def ensure_indexes(cur: sqlite3.Cursor) -> None:
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_email_actions_thread_id"
        " ON email_actions(thread_id)"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_email_actions_digest_date"
        " ON email_actions(digest_date)"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_email_actions_hash"
        " ON email_actions(latest_message_hash)"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_email_actions_review"
        " ON email_actions(review_status)"
    )


def get_schema_version(cur: sqlite3.Cursor) -> int:
    cur.execute("SELECT value FROM schema_meta WHERE key = 'schema_version'")
    row = cur.fetchone()
    if row is None:
        return 0
    return int(row[0])


def set_schema_version(cur: sqlite3.Cursor, version: int) -> None:
    cur.execute(
        "INSERT INTO schema_meta (key, value) VALUES ('schema_version', ?)"
        " ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (str(version),),
    )


def initialize(db_path: Path) -> None:
    existed = db_path.exists()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        ensure_base_schema(cur)
        before = get_schema_version(cur)
        added = [
            f"email_actions.{c}"
            for c in add_missing_columns(cur, "email_actions", EMAIL_ACTIONS_V2_COLUMNS)
        ]
        added += [
            f"run_history.{c}"
            for c in add_missing_columns(cur, "run_history", RUN_HISTORY_V2_COLUMNS)
        ]
        ensure_indexes(cur)
        set_schema_version(cur, SCHEMA_VERSION)
        conn.commit()
        if existed and added:
            print(f"migrated {db_path} v{before} -> v{SCHEMA_VERSION}, added: {', '.join(added)}")
        else:
            print(f"initialized {db_path} (schema v{SCHEMA_VERSION})")
    finally:
        conn.close()


def check(db_path: Path) -> int:
    if not db_path.exists():
        print(f"MISSING: {db_path} does not exist; run without --check to create it")
        return 1
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_meta'"
        )
        version = get_schema_version(cur) if cur.fetchone() else 0
        status = "OK" if version == SCHEMA_VERSION else "NEEDS MIGRATION"
        print(f"schema version: v{version} (current is v{SCHEMA_VERSION}) {status}")
        for table in ("email_actions", "run_history"):
            cur.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
                (table,),
            )
            if cur.fetchone() is None:
                print(f"{table}: MISSING")
                continue
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            cols = sorted(table_columns(cur, table))
            print(f"{table}: {count} rows, columns: {', '.join(cols)}")
        return 0 if version == SCHEMA_VERSION else 1
    finally:
        conn.close()


def main() -> int:
    args = [a for a in sys.argv[1:] if a != "--check"]
    check_only = "--check" in sys.argv[1:]
    if len(args) != 1:
        print("usage: init_state.py <sqlite-path> [--check]")
        return 1
    db_path = Path(args[0])
    if check_only:
        return check(db_path)
    initialize(db_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
