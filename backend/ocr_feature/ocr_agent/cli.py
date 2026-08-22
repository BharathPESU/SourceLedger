import argparse
import json
import logging
import sys
from pathlib import Path

from .schemas import DocumentType
from .agent import OCRAgentSystem

def main():
    parser = argparse.ArgumentParser(
        description="Gemini API Gateway Multimodal OCR & Structured Text Extraction CLI"
    )
    parser.add_argument(
        "image_path",
        type=str,
        help="Path to image file (PNG, JPEG, WEBP, BMP, TIFF, etc.)"
    )
    parser.add_argument(
        "--type",
        "-t",
        type=str,
        default="general",
        choices=["general", "receipt_invoice", "id_card", "table", "form"],
        help="Document schema type (default: general)"
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=None,
        help="Optional path to save output JSON"
    )
    parser.add_argument(
        "--no-refinement",
        action="store_true",
        help="Disable self-correction refinement tool loop"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable detailed logging"
    )

    args = parser.parse_args()

    log_level = logging.INFO if args.verbose else logging.WARNING
    logging.basicConfig(level=log_level, format="%(asctime)s [%(levelname)s] %(message)s")

    image_path = Path(args.image_path)
    if not image_path.exists():
        print(f"Error: File '{args.image_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    doc_type_map = {
        "general": DocumentType.GENERAL,
        "receipt_invoice": DocumentType.RECEIPT_INVOICE,
        "id_card": DocumentType.ID_CARD,
        "table": DocumentType.TABLE,
        "form": DocumentType.FORM,
    }
    doc_type = doc_type_map.get(args.type, DocumentType.GENERAL)

    print(f"🚀 Initializing OCR Agent System...")
    print(f"📷 Processing Image: {image_path}")
    print(f"📄 Document Type: {doc_type.value}\n")

    agent = OCRAgentSystem()
    result = agent.extract_structured_text(
        image_input=str(image_path),
        document_type=doc_type,
        enable_refinement=not args.no_refinement
    )

    print("=" * 60)
    print("🤖 AGENT EXECUTION TRAJECTORY")
    print("=" * 60)
    for step in result.agent_trajectory:
        status_icon = "✅" if step.status == "SUCCESS" else ("⚠️" if step.status == "WARNING" else "❌")
        print(f"Step {step.step_number} [{status_icon} {step.tool_name}]: {step.action_summary}")
        if step.output_summary:
            print(f"   ↳ {step.output_summary}")

    print("\n" + "=" * 60)
    print("📋 VALIDATION REPORT")
    print("=" * 60)
    print(f"Is Valid: {result.validation_report.is_valid}")
    print(f"Confidence Score: {result.validation_report.confidence_score * 100:.1f}%")
    print(f"Math Passed: {result.validation_report.math_checks_passed}")
    print(f"Completeness: {result.validation_report.completeness_score * 100:.1f}%")

    if result.validation_report.issues:
        print("\nIssues Identified:")
        for issue in result.validation_report.issues:
            print(f" - [{issue.severity}] Field '{issue.field}': {issue.message}")

    print("\n" + "=" * 60)
    print("💡 EXTRACTED STRUCTURED DATA (JSON)")
    print("=" * 60)
    json_output = json.dumps(result.structured_data, indent=2)
    print(json_output)

    if args.output:
        out_file = Path(args.output)
        out_file.write_text(json_output)
        print(f"\n💾 Saved structured result to '{out_file}'")

if __name__ == "__main__":
    main()
