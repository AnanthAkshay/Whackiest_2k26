from __future__ import annotations

from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field


CheckStatus = Literal["pass", "fail", "unknown", "not_applicable"]


class WorkbookStructure(BaseModel):
    sheetNames: List[str]
    expectedSheetsPresent: bool
    salesDataHeaders: List[str]
    expectedHeadersMatch: bool


class CheckResultItem(BaseModel):
    checkId: str
    name: str
    status: CheckStatus
    critical: bool
    score: float
    maxScore: float
    sourceRef: str
    explanation: str
    actionableHint: Optional[str] = None


class FormulaFact(BaseModel):
    factId: str
    metric: str
    sourceRef: str
    formula: Optional[str] = None
    supported: bool
    cachedValue: Optional[float] = None
    expectedValue: Optional[float] = None
    status: CheckStatus


class ExpectedVsActualTotals(BaseModel):
    expectedTotalRevenue: Optional[float] = None
    actualTotalRevenue: Optional[float] = None
    expectedAverageOrder: Optional[float] = None
    actualAverageOrder: Optional[float] = None
    expectedUniqueOrders: Optional[int] = None
    actualUniqueOrders: Optional[int] = None


class QualitativeObservation(BaseModel):
    factId: str
    sourceRef: str
    message: str


class FactSheet(BaseModel):
    attemptId: str
    artifactId: str
    validatorVersion: str
    fileHash: str
    status: Literal["ok", "review_required", "parse_error"]
    practicalScore: float = Field(ge=0.0, le=100.0)
    workbookStructure: WorkbookStructure
    checkResults: List[CheckResultItem]
    factIds: List[str]
    formulaFacts: List[FormulaFact]
    rowCounts: Dict[str, int]
    duplicateCounts: Dict[str, int]
    expectedVsActualTotals: ExpectedVsActualTotals
    qualitativeObservations: List[QualitativeObservation]
    warnings: List[str]
    errors: List[str]
