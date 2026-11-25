from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional

from .validator import validate_workbook


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Prooffolio deterministic spreadsheet validator")
    parser.add_argument("--file", required=True, help="Path to the .xlsx workbook")
    parser.add_argument("--attempt-id", required=True, help="AssessmentAttempt ID")
    parser.add_argument("--artifact-id", required=True, help="EvidenceArtifact ID")
    parser.add_argument("--expected", default=None, help="JSON string or path to expected outputs JSON")
    parser.add_argument("--output", default=None, help="Optional output path for the Fact Sheet JSON")
    args = parser.parse_args(argv)

    expected_data: Optional[Dict[str, Any]] = None
    if args.expected:
        expected_path = Path(args.expected)
        if expected_path.exists() and expected_path.is_file():
            expected_data = json.loads(expected_path.read_text(encoding="utf-8"))
        else:
            expected_data = json.loads(args.expected)

    fact_sheet = validate_workbook(
        file_path=args.file,
        attempt_id=args.attempt_id,
        artifact_id=args.artifact_id,
        expected_outputs=expected_data,
    )
    payload = fact_sheet.model_dump_json(indent=2)

    if args.output:
        Path(args.output).write_text(payload + "\n", encoding="utf-8")
    else:
        sys.stdout.write(payload + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
