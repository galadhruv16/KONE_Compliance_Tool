# DOMAIN_RULES.md

## 1. Purpose

This document defines the domain rules for comparing customer Technical Data Sheets (TDS) against KONE KTOC order forms.

It governs parameter identification, terminology mapping, value extraction, unit normalization, comparison, and result classification.

The application must identify genuine differences between the two documents without inventing engineering assumptions.

**The system is a compliance-assistance tool. It must not silently make engineering decisions on behalf of an authorized reviewer.**

## 2. Core Principles

1. Every comparison must be traceable to extracted source data.
2. Parameter mappings must be explicit and approved.
3. Values must be normalized before comparison.
4. Units must never be assumed when their meaning is unclear.
5. Unknown or ambiguous data must not produce an automatic match.
6. Extraction failures must remain distinct from genuine mismatches.
7. Engineering tolerances must come from an approved source.
8. Original extracted values must be preserved for auditing and debugging.

## 3. Canonical Parameter Model

Every supported parameter should have a stable canonical identifier.

A canonical parameter definition should contain:

- `id`: stable internal identifier.
- `displayName`: human-readable name.
- `aliases`: approved alternative labels.
- `dimension`: physical or logical quantity being represented.
- `canonicalUnit`: approved normalized unit, where applicable.
- `valueType`: number, integer, boolean, enum, or text.
- `comparisonRule`: approved comparison method.
- `tolerance`: approved tolerance, if applicable.
- `status`: active, deprecated, or pending approval.

Illustrative examples:

| Canonical ID | Display name | Example aliases |
|---|---|---|
| `car_width` | Car width | Cabin width, car internal width |
| `car_depth` | Car depth | Cabin depth, car internal depth |
| `car_height` | Car height | Cabin height, car internal height |
| `door_width` | Door width | Clear door opening width, entrance width |
| `door_height` | Door height | Clear door opening height |
| `shaft_width` | Shaft width | Hoistway width |
| `shaft_depth` | Shaft depth | Hoistway depth |

These are illustrative aliases, not an approved KONE engineering dictionary. Verify terminology against authorized documentation before enabling production comparisons.

## 4. Parameter Mapping

Mapping must be explicit and deterministic.

For each extracted label:

1. Normalize superficial text differences such as surrounding whitespace and capitalization.
2. Look up an exact approved alias.
3. Resolve the alias to its canonical parameter identifier.
4. Verify that the extracted value is compatible with that parameter's expected type and dimension.
5. If no approved mapping exists, mark the parameter for review.

Do not silently map parameters based solely on approximate string similarity.

For example, `car_width` and `shaft_width` must never be treated as interchangeable merely because their labels contain similar words.

If multiple canonical parameters could match an alias, return `REVIEW_REQUIRED`.

Never automatically add an alias to the approved mapping dictionary because an AI agent believes it is correct.

## 5. Value Extraction

For each extracted value, preserve:

- Original parameter label.
- Original raw value.
- Original unit, if present.
- Parsed value.
- Canonical parameter identifier, if resolved.
- Source document.
- Source location.
- Extraction status.

For Excel, preserve the sheet name and cell reference where available.

For PDF, preserve the page number and relevant text or table location where available.

Do not silently convert failed extraction into a missing parameter or a zero value.

## 6. Unit Normalization

All supported physical quantities must use an approved canonical unit before comparison.

Rules:

- Use explicit, tested conversion functions.
- Keep original and normalized values separately.
- Reject unknown or incompatible units.
- Do not infer units solely from the magnitude of a number.
- Do not compare values expressed in incompatible dimensions.
- Do not round values before applying the approved comparison rule.
- Handle decimal separators and locale-specific number formatting explicitly.
- Validate numeric inputs and reject non-finite values such as `NaN` and infinity.

For example, millimetres and metres can represent the same length after conversion. Length and area cannot be compared directly.

The canonical unit and conversion rules must be approved before a parameter becomes production-ready.

## 7. Comparison Rules

The comparison engine must be deterministic.

For every canonical parameter present in both documents:

1. Verify that both values were extracted successfully.
2. Verify that both values were mapped unambiguously.
3. Verify that their types and dimensions are compatible.
4. Normalize units.
5. Apply the approved comparison rule.
6. Produce the comparison status and preserve the supporting evidence.

Numeric equality must use an approved tolerance where applicable. Do not invent a universal tolerance for every parameter.

Tolerance rules must specify whether they use absolute tolerance, relative tolerance, exact equality, or another explicitly approved method.

## 8. Result Statuses

Use the statuses defined in `API_DESIGN.md`.

| Status | Meaning |
|---|---|
| `MATCH` | Both values were successfully extracted, mapped, normalized, and satisfy the approved comparison rule. |
| `MISMATCH` | Both values were successfully processed but fail the approved comparison rule. |
| `MISSING_IN_TDS` | The parameter is required for the comparison but is absent from the TDS. |
| `MISSING_IN_KTOC` | The parameter is required for the comparison but is absent from the KTOC form. |
| `REVIEW_REQUIRED` | Extraction, mapping, or interpretation is ambiguous and requires review. |
| `NOT_COMPARABLE` | A valid comparison cannot be performed, such as when units or value types are incompatible. |

Do not use `MATCH` as a default status.

Do not treat a missing parameter as a mismatch unless the approved business rule explicitly defines that behavior.

## 9. Required Parameter Configuration

Before enabling a parameter for production use, document:

- Canonical identifier.
- Approved display name.
- Approved aliases and their sources.
- Expected data type.
- Canonical unit.
- Conversion rules.
- Comparison method.
- Approved tolerance, if applicable.
- Source requirements.
- Known extraction limitations.
- Approval status and reviewer.

Parameters without sufficient approved information must remain disabled for automatic compliance decisions or require manual review.

## 10. Testing Requirements

Every supported parameter must have tests covering:

- Correct alias mapping.
- Unknown alias.
- Ambiguous alias.
- Valid extraction.
- Missing value.
- Invalid value.
- Valid unit conversion.
- Incompatible units.
- Matching values.
- Mismatching values.
- Tolerance boundaries, where applicable.

Use synthetic or authorized test documents. Do not commit confidential customer documents to the repository.

## 11. Change Control

Any change to an alias, canonical unit, conversion rule, tolerance, or comparison method is a domain-level behavior change.

Such changes require:

1. A documented reason.
2. An authoritative source or explicit reviewer approval.
3. Updated tests.
4. Updated documentation.
5. A `CHANGELOG.md` entry.

AI-generated suggestions are not approval.

## 12. Non-Negotiable Rule

**When the system cannot establish that two values represent the same parameter and can be compared correctly, it must expose the uncertainty rather than manufacture a compliance result.**

---

## 13. Engineering Drawing Hierarchy & Dynamic Discovery Rules

When comparing KTOC Order Forms against AutoCAD-exported Group PDFs, or comparing Supply-Line Drawing PDFs against Customer-Approved Drawing PDFs:

### 13.1 Group & Sheet Organization
- Engineering drawings are organized **per tower and per elevator group** (for example, a passenger group, service group, or fire group), each typically supplied as a multi-page PDF.
- Sheet types must be identified dynamically from sheet headers and title blocks rather than fixed page indices:
  - **`G-SHEET` (General / Specification Sheet):** Usually the initial 1–2 pages containing group summary parameters (travel height, capacity, passenger count, car dimensions, headroom, pit depth, etc.).
  - **`I-SHEET` (Installation / Sectional Views):** Sectional views, car top/front views, shaft elevations, and exterior entrance/door views.
  - **`LAYOUT_A_B` (A/B Detail Sheets):** Car, shaft, entrance, and component detail dimensions (front wall size, false ceiling, handrail codes, finishes, fixture layouts).
  - **`FLOOR_CHART`:** Stop/landing schedule per elevator. A group with uniform stops may use a single combined chart, whereas groups with split zoning (e.g., 4 elevators serving all floors and 2 elevators serving reserved floors) define per-elevator stop columns or separate charts.

### 13.2 Non-Deterministic Elevator & Group Naming
- Elevator identifiers and group names vary across TDS sheets, KTOC forms, and AutoCAD drawings.
- Never rely on hardcoded elevator prefixes (e.g., `C-`) or hardcoded sheet-to-lift alias maps.
- Group and elevator alignment must be derived dynamically from extracted identifiers, metadata, and structural context; uncertain alignments must trigger `REVIEW_REQUIRED`.

### 13.3 CAD Nomenclature & Standard-Code Differences
- Illustrative CAD/drawing tags observed in KONE workflows (to be verified against sample project drawings before production rules are enabled):
  - `SH`: Shaft Headroom / Overhead height
  - `PH`: Shaft Pit Depth
  - `CH`: Car Clear Height
  - `BB` / `DD`: Car Width / Car Depth
  - `WW` / `WD`: Shaft Width / Shaft Depth
  - `LL` / `HH`: Clear Door Opening Width / Height
  - Component & finish codes (e.g., front wall width, false ceiling code, handrail code such as `H64R`, button/fixture codes, wall/door finishes)
- **Regional / Code-Standard Differences (e.g., IS vs. EN):** Equivalent physical elevators can list different nominal values under different codes (such as passenger count differences between IS and EN calculation standards). Do not silently equate differing numbers without an explicitly approved code-equivalence rule; surface them for verification.

### 13.4 Asymmetric Local Drawing Revisions
- Drawings undergoing local engineering adjustments before customer submission may have views shifted left/right, elements resized, abbreviations tables altered, or revision/date blocks updated.
- Comparison logic must anchor on **sheet type, view titles, table rows/columns, and spatial callout pairs** rather than assuming identical pixel coordinates across revisions.

---

## 14. Drawing Revision & MS2 Material-Order Impact Gate

When comparing **Supply-Line Drawing PDF (Rev 1)** against **Customer-Approved Drawing PDF** (whether annotated digitally with basic Adobe text edits or printed, handwritten, and scanned back):

### 14.1 MS2 Impact Classifications
Every detected discrepancy or customer markup must carry an explicit MS2 release impact status:

| MS2 Classification | Meaning | MS2 Release Effect |
|---|---|---|
| `SUPPLY_LINE_IMPACT` | Change alters factory-ordered material, structural dimensions, components, or finishes (e.g., car height `CH`, button/COP/LOP model, door/wall finish, handrail, false ceiling, rated load/speed). | **Blocks MS2 (`MS2D`)** — Must notify Supply Line / Manufacturing for drawing & material order revision. |
| `LOCAL_CONSTRUCTION_ONLY` | Change affects only local installation positioning or site/drawing notes without modifying factory BOM (e.g., relocating Landing Call Station from left side to right side of landing door using identical hardware). | **Does Not Block MS2** — Update local drawing only; safe for MS2 material order release once confirmed. |
| `REQUIRES_ENGINEERING_REVIEW` | Handwritten/scanned markup cannot be parsed cleanly, text edit is ambiguous, or affected component lacks an approved MS2 impact rule. | **Blocks MS2 (`MS2D`)** until an engineer inspects the highlighted crop/region and confirms classification. |

### 14.2 Non-Negotiable MS2 Safety Rule
**No ambiguous edit, unreadable handwritten comment, or unmapped parameter change may ever be auto-classified as `LOCAL_CONSTRUCTION_ONLY` or `MS2_CLEAR`.** Whenever uncertainty exists, the item must block MS2 under `REQUIRES_ENGINEERING_REVIEW`.