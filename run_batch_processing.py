"""Batch runner script — processes input CSV files into the output directory."""

import asyncio
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
root_dir = Path(__file__).parent
sys.path.insert(0, str(root_dir / "backend"))

from backend.src.services.csv_processor import CSVProcessor


async def main() -> None:
    input_csv = root_dir / "input" / "Unihack_ Sample Dataset - Input.csv"
    output_dir = root_dir / "output"

    print("==================================================")
    print(" Processing Input CSV through SourceLedger Agents ")
    print("==================================================")
    print(f"Input file:  {input_csv}")
    print(f"Output dir:  {output_dir}")

    processor = CSVProcessor()
    # Process sample batch of 50 records
    summary = await processor.process_file(
        input_csv_path=input_csv,
        output_dir=output_dir,
        max_rows=50,
    )

    print("\n==================================================")
    print(f" Batch processing complete! Total processed: {summary['total_processed']}")
    print(f" Output CSV:  {summary['output_csv']}")
    print(f" Output JSON: {summary['output_json']}")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(main())
