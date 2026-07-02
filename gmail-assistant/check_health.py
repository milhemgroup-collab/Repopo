"""Print a quick health summary of the Gmail assistant state database.

Gives Matt a one-command view of what the assistant has been doing without
opening SQLite by hand: last runs, classification mix, drafts, errors, and
rows still awaiting review.

Usage:
    python check_health.py [sqlite-path] [--days N]

Defaults: state.sqlite next to this script, last 7 days.
"""

import sqlite3
import sys
from pathlib import Path


def fetch_all(cur, sql, params=()):
    cur.execute(sql, params)
    return cur.fetchall()


def main() -> int:
    args = sys.argv[1:]
    days = 7
    if "--days" in args:
        i = args.index("--days")
        try:
            days = int(args[i + 1])
        except (IndexError, ValueError):
            print("usage: check_health.py [sqlite-path] [--days N]")
            return 1
        del args[i : i + 2]
    db_path = Path(args[0]) if args else Path(__file__).resolve().parent / "state.sqlite"

    if not db_path.exists():
        print(f"MISSING: {db_path} does not exist; run init_state.py first")
        return 1

    since = f"-{days} days"
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()

        print(f"database: {db_path}")
        rows = fetch_all(cur, "SELECT value FROM schema_meta WHERE key = 'schema_version'")
        print(f"schema version: v{rows[0][0]}" if rows else "schema version: v1 (no schema_meta)")

        print(f"\n== last 5 runs ==")
        runs = fetch_all(
            cur,
            """
            SELECT run_started_at, run_finished_at, run_mode, candidate_count,
                   processed_count, draft_count, error_count
            FROM run_history ORDER BY id DESC LIMIT 5
            """,
        )
        if not runs:
            print("no runs recorded")
        for started, finished, mode, cand, proc, drafts, errors in runs:
            done = finished or "DID NOT FINISH"
            print(
                f"{started} -> {done} [{mode}]"
                f" candidates={cand} processed={proc} drafts={drafts} errors={errors}"
            )

        print(f"\n== classifications (last {days} days) ==")
        for cls, count in fetch_all(
            cur,
            """
            SELECT COALESCE(classification, '(skipped)'), COUNT(*)
            FROM email_actions WHERE created_at >= datetime('now', ?)
            GROUP BY 1 ORDER BY 2 DESC
            """,
            (since,),
        ):
            print(f"{count:5d}  {cls}")

        drafted = fetch_all(
            cur,
            """
            SELECT created_at, sender, subject FROM email_actions
            WHERE draft_created = 1 AND created_at >= datetime('now', ?)
            ORDER BY created_at DESC
            """,
            (since,),
        )
        print(f"\n== drafts created (last {days} days): {len(drafted)} ==")
        for created, sender, subject in drafted:
            print(f"{created}  {sender}  |  {subject}")

        cols = {r[1] for r in fetch_all(cur, "PRAGMA table_info(email_actions)")}
        if "skip_reason" in cols:
            print(f"\n== skip reasons (last {days} days) ==")
            for reason, count in fetch_all(
                cur,
                """
                SELECT skip_reason, COUNT(*) FROM email_actions
                WHERE skip_reason IS NOT NULL AND created_at >= datetime('now', ?)
                GROUP BY 1 ORDER BY 2 DESC
                """,
                (since,),
            ):
                print(f"{count:5d}  {reason}")

        if "review_status" in cols:
            pending = fetch_all(
                cur,
                "SELECT COUNT(*) FROM email_actions WHERE review_status = 'pending'",
            )[0][0]
            print(f"\nrows awaiting review: {pending}")

        errors = fetch_all(
            cur,
            """
            SELECT created_at, sender, subject, reason FROM email_actions
            WHERE (classification = 'error' OR labels_applied LIKE '%AI/Error%')
              AND created_at >= datetime('now', ?)
            """,
            (since,),
        )
        print(f"errors (last {days} days): {len(errors)}")
        for created, sender, subject, reason in errors:
            print(f"  {created}  {sender}  |  {subject}  |  {reason}")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
