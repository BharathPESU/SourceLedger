import logging
from typing import Any, Dict, List, Optional

from .schemas import (
    DocumentType,
    ExtractionResult,
    ValidationReport,
    AgentStep,
)
from .gateway_client import GeminiGatewayClient
from .tools import (
    ImagePreprocessorTool,
    MultimodalExtractorTool,
    ValidationTool,
    RefinementTool,
)

logger = logging.getLogger("ocr_agent.agent")

class OCRAgentSystem:
    """
    Autonomous Agent System for Multimodal Structured OCR Text Extraction.
    Uses tool loop (Preprocessing -> Multimodal Extraction -> Validation -> Refinement Loop).
    """
    def __init__(
        self,
        gateway_client: Optional[GeminiGatewayClient] = None,
        max_refinement_iterations: int = 2
    ):
        self.client = gateway_client or GeminiGatewayClient()
        self.max_refinement_iterations = max_refinement_iterations

    def extract_structured_text(
        self,
        image_input: Any,
        document_type: DocumentType = DocumentType.GENERAL,
        enable_refinement: bool = True
    ) -> ExtractionResult:
        """
        Main Agent Execution Pipeline:
        1. Tool: Image Preprocessing
        2. Tool: Multimodal Extraction via Gemini API Gateway
        3. Tool: Output Validation & Math Audit
        4. Tool (Iterative): Refinement Loop if errors detected
        """
        trajectory: List[AgentStep] = []
        step_counter = 1

        # Step 1: Preprocessing Tool
        logger.info(f"Agent Step {step_counter}: Running Image Preprocessor Tool...")
        try:
            image_bytes, mime_type, meta = ImagePreprocessorTool.preprocess_image(image_input)
            trajectory.append(
                AgentStep(
                    step_number=step_counter,
                    tool_name="ImagePreprocessorTool",
                    action_summary=f"Processed input image to {meta['final_mime_type']} ({meta['width']}x{meta['height']}, {meta['byte_size']} bytes)",
                    status="SUCCESS",
                    output_summary=f"Format: {meta['final_mime_type']}, Size: {meta['width']}x{meta['height']}px"
                )
            )
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            return ExtractionResult(
                document_type=document_type,
                structured_data={"error": f"Image preprocessing failed: {e}"},
                validation_report=ValidationReport(is_valid=False, confidence_score=0.0, issues=[]),
                agent_trajectory=[
                    AgentStep(
                        step_number=step_counter,
                        tool_name="ImagePreprocessorTool",
                        action_summary=f"Failed to process image: {e}",
                        status="FAILED"
                    )
                ]
            )

        step_counter += 1

        # Step 2: Initial Multimodal Extraction Tool
        logger.info(f"Agent Step {step_counter}: Running Multimodal Extraction Tool...")
        try:
            extracted_data = MultimodalExtractorTool.extract(
                client=self.client,
                image_bytes=image_bytes,
                mime_type=mime_type,
                document_type=document_type
            )
            raw_text = extracted_data.get("raw_text", "")
            trajectory.append(
                AgentStep(
                    step_number=step_counter,
                    tool_name="MultimodalExtractionTool",
                    action_summary=f"Extracted initial structured data using document type '{document_type.value}'",
                    status="SUCCESS",
                    output_summary=f"Extracted {len(extracted_data)} top-level fields"
                )
            )
        except Exception as e:
            logger.error(f"Multimodal extraction failed: {e}")
            return ExtractionResult(
                document_type=document_type,
                structured_data={"error": f"Extraction failed: {e}"},
                validation_report=ValidationReport(is_valid=False, confidence_score=0.0, issues=[]),
                agent_trajectory=trajectory + [
                    AgentStep(
                        step_number=step_counter,
                        tool_name="MultimodalExtractionTool",
                        action_summary=f"API extraction failed: {e}",
                        status="FAILED"
                    )
                ]
            )

        step_counter += 1

        # Step 3: Validation Tool
        logger.info(f"Agent Step {step_counter}: Running Validation Tool...")
        val_report = ValidationTool.validate(extracted_data, document_type)
        trajectory.append(
            AgentStep(
                step_number=step_counter,
                tool_name="ValidationTool",
                action_summary=f"Audited extraction: Valid={val_report.is_valid}, Confidence={val_report.confidence_score}, MathPassed={val_report.math_checks_passed}",
                status="SUCCESS",
                output_summary=f"{len(val_report.issues)} issue(s) detected. Refinement Recommended: {val_report.refinement_recommended}"
            )
        )

        step_counter += 1

        # Step 4: Refinement Tool Loop if issues found
        iteration = 0
        while (
            enable_refinement
            and val_report.refinement_recommended
            and iteration < self.max_refinement_iterations
        ):
            iteration += 1
            logger.info(f"Agent Step {step_counter}: Running Refinement Tool (Iteration {iteration})...")

            try:
                refined_data = RefinementTool.refine(
                    client=self.client,
                    image_bytes=image_bytes,
                    mime_type=mime_type,
                    previous_data=extracted_data,
                    report=val_report
                )

                # Re-validate refined output
                new_val_report = ValidationTool.validate(refined_data, document_type)

                trajectory.append(
                    AgentStep(
                        step_number=step_counter,
                        tool_name="RefinementTool",
                        action_summary=f"Executed self-correction iteration {iteration}. New Confidence={new_val_report.confidence_score}",
                        status="SUCCESS",
                        output_summary=f"Issues changed from {len(val_report.issues)} to {len(new_val_report.issues)}"
                    )
                )

                extracted_data = refined_data
                val_report = new_val_report
                if raw_text == "" and "raw_text" in extracted_data:
                    raw_text = extracted_data["raw_text"]

            except Exception as ref_err:
                logger.warning(f"Refinement iteration {iteration} failed: {ref_err}")
                trajectory.append(
                    AgentStep(
                        step_number=step_counter,
                        tool_name="RefinementTool",
                        action_summary=f"Refinement iteration {iteration} encountered error: {ref_err}",
                        status="WARNING"
                    )
                )
                break

            step_counter += 1

        return ExtractionResult(
            document_type=document_type,
            structured_data=extracted_data,
            validation_report=val_report,
            raw_text=raw_text,
            agent_trajectory=trajectory
        )
