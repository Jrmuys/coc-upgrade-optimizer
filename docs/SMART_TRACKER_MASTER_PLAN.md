# CoC Tracker Consolidated Implementation Plan

| Field | Value |
|---|---|
| Date | 2026-03-01 (Updated) |
| Status | In Progress (Phases 0-7 Complete, Phase 8 Complete, Phase 8b In Progress, Phases 9-17 Planned) |
| Owner | jrmuy |
| Scope | Web-based tracker (0-7) + Personal desktop assistant evolution (8-17) |

## Table of Contents

- [CoC Tracker Consolidated Implementation Plan](#coc-tracker-consolidated-implementation-plan)
  - [Table of Contents](#table-of-contents)
  - [Plan Intent](#plan-intent)
  - [Phase Overview](#phase-overview)
    - [Quick Reference](#quick-reference)
  - [Baseline References (Current System of Record)](#baseline-references-current-system-of-record)
  - [Product Objectives](#product-objectives)
  - [Non-Goals](#non-goals)
  - [Constraints and Assumptions](#constraints-and-assumptions)
  - [Program Structure](#program-structure)
  - [Delivery Phases](#delivery-phases)
    - [Phase 0 - Baseline Capture and Instrumentation](#phase-0---baseline-capture-and-instrumentation)
      - [Scope](#scope)
      - [Tasks](#tasks)
      - [Deliverables](#deliverables)
      - [Exit Criteria](#exit-criteria)
    - [Phase 1 - Scheduler Core Correctness Hardening](#phase-1---scheduler-core-correctness-hardening)
      - [Objectives](#objectives)
      - [Tasks — Task Construction](#tasks--task-construction)
      - [Tasks — Predecessor Locks](#tasks--predecessor-locks)
      - [Tasks — Worker Scheduling](#tasks--worker-scheduling)
      - [Tasks — Safety and Side Effects](#tasks--safety-and-side-effects)
      - [Acceptance Criteria](#acceptance-criteria)
    - [Phase 2 - Data Integrity and Validation](#phase-2---data-integrity-and-validation)
      - [Objectives](#objectives-1)
      - [Tasks — Input Layer](#tasks--input-layer)
      - [Tasks — Mapping and Config Data](#tasks--mapping-and-config-data)
      - [Tasks — Error Presentation](#tasks--error-presentation)
      - [Acceptance Criteria](#acceptance-criteria-1)
    - [Phase 3 - UX Workflow Consistency](#phase-3---ux-workflow-consistency)
      - [Objectives](#objectives-2)
      - [Tasks — Controls and Settings](#tasks--controls-and-settings)
      - [Tasks — Smart Tracker Summary](#tasks--smart-tracker-summary)
      - [Tasks — Timeline and Cards Sync](#tasks--timeline-and-cards-sync)
      - [Acceptance Criteria](#acceptance-criteria-2)
    - [Phase 4 - Persistence Reliability and Migration Safety](#phase-4---persistence-reliability-and-migration-safety)
      - [Objectives](#objectives-3)
      - [Tasks — Storage Schema](#tasks--storage-schema)
      - [Tasks — Data Lifecycles](#tasks--data-lifecycles)
      - [Acceptance Criteria](#acceptance-criteria-3)
    - [Phase 5 - Performance and Scalability](#phase-5---performance-and-scalability)
      - [Objectives](#objectives-4)
      - [Tasks — Scheduler Performance](#tasks--scheduler-performance)
      - [Tasks — UI Performance](#tasks--ui-performance)
      - [Acceptance Criteria](#acceptance-criteria-4)
    - [Phase 6 - Testing Strategy and Quality Gates](#phase-6---testing-strategy-and-quality-gates)
      - [Objectives](#objectives-5)
      - [Test Layers](#test-layers)
      - [Core Test Scenarios](#core-test-scenarios)
      - [Quality Gates](#quality-gates)
    - [Phase 7 - Release and Stabilization](#phase-7---release-and-stabilization)
      - [Release Tasks](#release-tasks)
      - [Stabilization Tasks](#stabilization-tasks)
      - [Acceptance Criteria](#acceptance-criteria-5)
  - [Future Evolution: Personal Smart CoC Assistant (Phases 8-15)](#future-evolution-personal-smart-coc-assistant-phases-8-15)
    - [Phase 8 - Multi-Objective Optimization Engine](#phase-8---multi-objective-optimization-engine)
    - [Phase 8b - Constraint Programming Scheduler (CP-SAT) Refactor](#phase-8b---constraint-programming-scheduler-cp-sat-refactor)
      - [Objectives](#objectives-6)
      - [Tasks](#tasks-1)
      - [Success Criteria](#success-criteria-6)
      - [Timeline Estimate](#timeline-estimate)
    - [Phase 9 - Multi-Village Persistent Model](#phase-9---multi-village-persistent-model)
      - [Objectives](#objectives-7)
      - [Tasks](#tasks-2)
      - [Acceptance Criteria](#acceptance-criteria-7)
    - [Phase 10 - Real-Time Builder Available Assistant](#phase-10---real-time-builder-available-assistant)
      - [Objectives](#objectives-8)
      - [Tasks](#tasks-3)
      - [Acceptance Criteria](#acceptance-criteria-8)
    - [Phase 11 - Adaptive Rescheduling Engine](#phase-11---adaptive-rescheduling-engine)
      - [Objectives](#objectives-9)
      - [Tasks](#tasks-4)
      - [Acceptance Criteria](#acceptance-criteria-9)
    - [Phase 12 - Rush Mode Policy Engine](#phase-12---rush-mode-policy-engine)
      - [Objectives](#objectives-10)
      - [Tasks](#tasks-5)
      - [Acceptance Criteria](#acceptance-criteria-10)
    - [Phase 13 - Windows Companion Service (OCR Ingestion)](#phase-13---windows-companion-service-ocr-ingestion)
      - [Objectives](#objectives-11)
      - [Tasks](#tasks-6)
      - [Acceptance Criteria](#acceptance-criteria-11)
    - [Phase 14 - Ingestion Reconciliation Layer](#phase-14---ingestion-reconciliation-layer)
      - [Objectives](#objectives-12)
      - [Tasks](#tasks-7)
      - [Acceptance Criteria](#acceptance-criteria-12)
    - [Phase 15 - Advanced Tracking UX and Insights](#phase-15---advanced-tracking-ux-and-insights)
      - [Objectives](#objectives-13)
      - [Tasks](#tasks-8)
      - [Acceptance Criteria](#acceptance-criteria-13)
    - [Phase 16 - Import/Export and Backup/Restore](#phase-16---importexport-and-backuprestore)
      - [Objectives](#objectives-14)
      - [Tasks](#tasks-9)
      - [Acceptance Criteria](#acceptance-criteria-14)
    - [Phase 17 - Comprehensive Testing for Advanced Features](#phase-17---comprehensive-testing-for-advanced-features)
      - [Objectives](#objectives-15)
      - [Tasks](#tasks-10)
      - [Acceptance Criteria](#acceptance-criteria-15)
  - [Comprehensive Verification Plan (Phases 8-17)](#comprehensive-verification-plan-phases-8-17)
    - [Functional Verification](#functional-verification)
    - [Multi-Village Verification](#multi-village-verification)
    - [OCR Pipeline Verification](#ocr-pipeline-verification)
    - [Quality and Integration Checks](#quality-and-integration-checks)
    - [Acceptance Gates](#acceptance-gates)
  - [Evolution Dependency Map](#evolution-dependency-map)
  - [Technical Architecture Evolution](#technical-architecture-evolution)
    - [Current Architecture (Phases 0-7)](#current-architecture-phases-0-7)
    - [Target Architecture (Phases 8-17)](#target-architecture-phases-8-17)
    - [Migration Path](#migration-path)
  - [Product Vision Alignment](#product-vision-alignment)
  - [Cross-Cutting Technical Decisions](#cross-cutting-technical-decisions)
  - [Dependency Map](#dependency-map)
  - [Risks and Mitigations](#risks-and-mitigations)
    - [Risk Register](#risk-register)
  - [Milestone Plan](#milestone-plan)
    - [Milestone M1 - Baseline Locked](#milestone-m1---baseline-locked)
    - [Milestone M2 - Core Correctness Ready](#milestone-m2---core-correctness-ready)
    - [Milestone M3 - Input and UX Stable](#milestone-m3---input-and-ux-stable)
    - [Milestone M4 - Persistence and Performance](#milestone-m4---persistence-and-performance)
    - [Milestone M5 - Release Complete](#milestone-m5---release-complete)
  - [Work Breakdown by Component](#work-breakdown-by-component)
    - [Scheduler Component](#scheduler-component)
    - [App Component](#app-component)
    - [Timeline Component](#timeline-component)
    - [Cards Component](#cards-component)
    - [Active Time Component](#active-time-component)
  - [Documentation Deliverables](#documentation-deliverables)
  - [Backlog Prioritization (Post-Phase-7 Web App Enhancements)](#backlog-prioritization-post-phase-7-web-app-enhancements)
    - [High Priority](#high-priority)
    - [Medium Priority](#medium-priority)
    - [Low Priority](#low-priority)
  - [Definition of Done](#definition-of-done)
  - [Implementation Checklist (Actionable Summary)](#implementation-checklist-actionable-summary)
  - [Sign-Off Matrix](#sign-off-matrix)
  - [Execution Roadmap Summary](#execution-roadmap-summary)
    - [Current State (March 2026)](#current-state-march-2026)
    - [Next Steps (Phase 8+)](#next-steps-phase-8)
    - [Success Criteria](#success-criteria)
    - [Timeline Estimate (Phases 8-17)](#timeline-estimate-phases-8-17)
    - [Risk Mitigation](#risk-mitigation)
  - [Document History](#document-history)
  - [Appendix: Quick Start Guide](#appendix-quick-start-guide)
    - [For New Contributors](#for-new-contributors)
    - [For Users](#for-users)

## Plan Intent

**Phases 0-7 (Web-Based Tracker Stabilization):**
- Condense the broader product and technical roadmap into one implementation-ready document.
- Keep the existing React scheduler behavior as the baseline and evolve safely from that foundation.
- Preserve detailed execution steps, sequencing, acceptance criteria, and release checkpoints.
- Focus on changes that improve reliability, maintainability, and scheduling quality.
- Minimize UX churn while tightening core planner correctness.
- Keep scope aligned to current project shape and data files.
- Ensure all work can be delivered incrementally without blocking day-to-day use.
- Use current repository architecture rather than introducing a full rewrite.
- Prioritize root-cause fixes over cosmetic patches.
- Keep each workstream testable independently.

**Phases 8-17 (Personal Desktop Assistant Evolution):**
- Transform static web optimizer into intelligent personal assistant
- Add multi-objective optimization beyond LPT/SPT (balanced, hero-availability, rush-mode, resource-smoothing)
- Support multi-village tracking with independent strategies and progress
- Build real-time builder-available assistant with live recommendations
- Implement adaptive rescheduling that syncs plan to reality without manual regeneration
- Create Windows companion service for screenshot/OCR passive state ingestion
- Provide automated reconciliation between planned and actual game state
- Deliver desktop app experience (Electron or native) with background monitoring
- Maintain local-first, privacy-focused architecture (no cloud dependencies)

## Phase Overview

| Phase Group | Phases | Status | Goal | Platform |
|-------------|--------|--------|------|----------|
| **Web Tracker Stabilization** | 0-7 | ✅ Complete | Reliable web-based optimizer with persistence and performance | React SPA (GitHub Pages) |
| **Constraint Programming Migration** | 8-8b | 📋 In Progress | Replace greedy scheduler with CP-SAT solver for provably optimal schedules | React SPA (GitHub Pages) |
| **Desktop Assistant Evolution** | 9-17 | 📋 Planned | Intelligent personal assistant with OCR and adaptive scheduling | Desktop (Electron/Windows) + Companion Service |

### Quick Reference

**Phases 0-7** (✅ Complete):
- Phase 0: Baseline capture
- Phase 1: Scheduler correctness
- Phase 2: Data validation
- Phase 3: UX consistency
- Phase 4: Persistence & migration
- Phase 5: Performance optimization
- Phase 6: Test coverage
- Phase 7: Release & stabilization

**Phase 8** (✅ Complete - March 2026):
- Multi-objective optimization with 5 profiles (TimeMax, Balanced, HeroAvailability, ResourceSmoothing, RushMode)
- Greedy list-scheduling with weighted task selection
- Objective scoring in UI tooltips and cards

**Phase 8b** (📋 In Progress):
- Replace greedy scheduler with Google OR-Tools CP-SAT constraint programming solver
- Hard constraints: precedence, worker capacity, sleep window
- Soft penalties: weighted completion time, resource smoothing, builder idle time
- Automatic "Just-In-Time Town Hall Trigger" - TH scheduled when builders run out of parallel work
- Resource smoothing without hardcoded farming rates (daily cost variance minimization)
- Est. effort: 11-12 hours (1.5 days focused work)

**Phases 9-17** (📋 Planned):
- Phase 9: Multi-village persistent model (3+ villages)
- Phase 10: Real-time builder assistant (live recommendations)
- Phase 11: Adaptive rescheduling (auto-sync to reality)
- Phase 12: Rush mode policy engine (TH upgrade critical paths)
- Phase 13: Windows companion service (OCR ingestion)
- Phase 14: Ingestion reconciliation (plan vs. reality)
- Phase 15: Advanced tracking UX (contextual insights)
- Phase 16: Import/export & backup (data resilience)
- Phase 17: Comprehensive testing (50+ tests)

## Baseline References (Current System of Record)

- Scheduler core and task construction: src/scheduler.js
- App orchestration and state management: src/App.js
- Timeline visualization baseline: src/BuilderTimeline.jsx
- Card-based schedule list baseline: src/TimelineCards.jsx
- Active time window input baseline: src/ActiveTimeInput.jsx
- Color mapping baseline: src/colorMap.js
- Existing test scaffold baseline: src/App.test.js
- Source data baselines: src/data
- New extracted data assets baseline: src/data/new_data
- Public app purpose baseline: README.md

## Product Objectives

**Current Product (Phases 0-7):**
- Generate reliable upgrade schedules for Home and Builder bases.
- Support practical day-to-day tracking of completed upgrades.
- Keep planner responsive for large task sets.
- Preserve deterministic outcomes for same inputs and settings.
- Improve confidence in precedence constraints and worker assignment.
- Make schedule strategy behavior clear between LPT and SPT modes.
- Provide transparent handling for active-time windows.
- Reduce confusion around local persistence keys and mode switching.
- Improve resilience to malformed or partial exported JSON.
- Keep deployment path compatible with current React Scripts setup.

**Evolved Product (Phases 8-17):**
- **Multi-Objective Planning:** Balance competing priorities (speed, hero availability, resource usage, rush gates)
- **Multi-Village Support:** Track 3+ villages independently with per-village strategies
- **Real-Time Assistant:** Live "start this now" recommendations as builders become available
- **Adaptive Sync:** Automatically adjust schedule when reality drifts from plan
- **Rush Mode:** Focused optimization for TH upgrade critical paths
- **Passive Awareness:** OCR ingestion from CoC window for hands-free state tracking
- **Intelligent Reconciliation:** Detect and resolve conflicts between plan and actual game state
- **Contextual Guidance:** Show recommendation reasons, hero-lock warnings, resource-pressure alerts
- **Local-First Privacy:** All data stays on user's machine, no cloud dependencies
- **Desktop Experience:** Always-on background monitoring with system tray integration

## Non-Goals

**Phases 0-7:**
- No migration to a new frontend framework.
- No cloud backend or account sync in this cycle.
- No multiplayer/shared boards in this cycle.
- No redesign of core domain data format in this cycle.
- No mass rename of existing IDs used across JSON mappings.
- No hard dependency on server-side scheduling.
- No broad theme overhaul.
- No package manager migration.
- No breaking changes to current user import flow.

**Phases 8-17:**
- No cloud/server backend (maintain local-first architecture)
- No mobile app version (Windows desktop only for Phases 8-17)
- No automated game interaction (read-only OCR, no bot functionality)
- No multiplayer/clan coordination features
- No third-party service integrations (Discord, analytics, etc.)
- No paid/subscription model or commercialization
- No Mac/Linux companion service (Windows-only for Phase 13)

## Constraints and Assumptions

**Phases 0-7:**
- React app remains single-page and client-side only.
- Local storage remains primary persistence mechanism.
- Input data continues to come from game export JSON.
- Existing mapping and config JSON files remain authoritative unless explicitly updated.
- Scheduler must continue supporting both home and builder bases.
- Existing priority model remains optional toggle behavior.
- Existing strategy options remain LPT and SPT.
- Timeline and card views remain synchronized for done-state.
- The app remains deployable via current build/deploy scripts.
- Browser support follows existing browserslist config.

**Phases 8-17:**
- Desktop app wraps existing React UI (Electron or native container)
- Windows companion service required for OCR features
- OCR accuracy depends on screen resolution and CoC UI language (English initially)
- User must have Clash of Clans installed for companion service features
- Multi-village support assumes user manually switches accounts in CoC (no automation)
- All persistent data remains local (no cloud sync)
- Companion service runs only when user is logged into Windows
- Screenshot capture respects privacy (local storage only, user can review/delete)

## Program Structure

- Stream A: Scheduler correctness and determinism.
- Stream B: Data integrity and validation.
- Stream C: UX workflow consistency and clarity.
- Stream D: Persistence correctness and migration safety.
- Stream E: Performance and scalability.
- Stream F: Quality gates and release execution.
- Streams run in parallel with defined dependency gates.
- Every stream ships behind existing UI controls where possible.
- Each stream has explicit acceptance criteria.
- Each stream includes rollback-safe implementation slices.

## Delivery Phases

- Phase 0: Baseline capture and instrumentation.
- Phase 1: Correctness hardening in scheduler core.
- Phase 2: Input validation and data normalization.
- Phase 3: UI consistency and interaction polish.
- Phase 4: Persistence reliability and migration guardrails.
- Phase 5: Performance tuning and memory reduction.
- Phase 6: Test expansion and release prep.
- Phase 7: Production verification and post-release stabilization.
- Each phase ends with a checklist and sign-off.
- No phase closes without reproducible validation results.

### Phase 0 - Baseline Capture and Instrumentation

#### Scope

- Capture current behavior and known pain points without changing outputs yet.
- Add lightweight internal logging toggles for debug builds.
- Document current scheduler edge-case behavior.

#### Tasks

- Record baseline schedule outputs for representative exported JSON snapshots.
- Capture current makespan values for LPT and SPT on same inputs.
- Capture baseline behavior with active-time enabled and disabled.
- Document done-state persistence key patterns by village and strategy.
- Identify all points where JSON parse errors surface.
- Confirm existing treatment of ongoing upgrades with priority 1.
- Enumerate current precedence-locking assumptions.
- Collect startup time and schedule generation latency metrics.
- Snapshot timeline render time with large schedule lists.
- Snapshot memory footprint in a long session.

#### Deliverables

- Baseline behavior matrix per scenario.
- Baseline output fixtures for regression use.
- Initial issue list linked to root causes.
- Measurement spreadsheet and reproducible steps.
- Baseline sign-off notes.

#### Exit Criteria

- At least five representative datasets captured.
- At least one home and one builder base sample included.
- All baseline artifacts stored in repo documentation.
- Team can reproduce baseline outputs in under 10 minutes.
- No production logic changes merged in this phase.

### Phase 1 - Scheduler Core Correctness Hardening

#### Objectives

- Guarantee stable deterministic scheduling for same inputs.
- Remove side effects that run scheduler unexpectedly.
- Strengthen predecessor and worker assignment logic.

#### Tasks — Task Construction

- Isolate task construction into pure functions where feasible.
- Ensure missing mapping entries are surfaced as structured warnings.
- Normalize task key generation into one canonical helper.
- Validate iter semantics across building duplicates.
- Validate missing-building generation against TH/BH diffs.
- Ensure boost application is applied once and only once per duration.
- Verify currently upgrading items always keep highest priority lane.
- Ensure hero tasks link correctly to Hero Hall requirements.
- Confirm builder army exceptions remain explicit and tested.
- Normalize fallback priority behavior when priority map is absent.

#### Tasks — Predecessor Locks

- Validate predecessor graph has no accidental cycles.
- Ensure predecessor references are index-safe after sorting.
- Confirm hero predecessor constraints work when Hero Hall absent.
- Replace throw-heavy paths with recoverable user-facing errors when possible.
- Add targeted guards for missing required prerequisite tasks.
- Ensure predecessor release logic is consistent for multiple predecessors.
- Confirm predecessor logic works with merged home/builder pathways.
- Add deterministic order when multiple successors become ready simultaneously.
- Verify no mutation leaks across schedule reruns.
- Document graph rules in plain language.

#### Tasks — Worker Scheduling

- Keep running tasks priority above ready queue tasks.
- Confirm free worker selection behavior is deterministic.
- Validate predecessor-worker affinity logic does not deadlock.
- Ensure active-time off-window transitions are mathematically correct.
- Verify day rollover handling around exact boundary times.
- Validate no skipped tasks in edge windows.
- Ensure loop overflow guard remains but is diagnosable.
- Capture scheduler iteration count for diagnostics.
- Verify makespan formula stays tied to schedule start.
- Harden handling for empty ready queue with pending notReady tasks.

#### Tasks — Safety and Side Effects

- Remove direct invocation at module tail from scheduler file.
- Ensure module import does not trigger compute work.
- Prevent accidental console noise in production mode.
- Gate debug printing behind explicit debug flag.
- Keep public API shape stable for current App usage.
- Add explicit error objects rather than mixed tuple patterns where feasible.
- Document all API fields returned by schedule generator.
- Ensure backward compatibility with existing callers.
- Add strict checks for required JSON fields by base type.
- Confirm exceptions never crash the app render path.

#### Acceptance Criteria

- Same dataset + same settings returns identical schedule ordering every run.
- No scheduler compute runs during idle import.
- No uncaught exceptions for malformed but recoverable inputs.
- Predecessor chains validated for sampled hero/building combinations.
- Active-time schedule boundaries remain within configured windows.
- Regression fixtures pass for baseline datasets.
- LPT/SPT strategy differences remain expected and explainable.
- Makespan matches verified post-processing calculations.
- Build passes with no new lint-critical errors.
- User-facing error state remains actionable and non-blocking.

### Phase 2 - Data Integrity and Validation

#### Objectives

- Make input handling robust for incomplete exports.
- Reduce silent failures caused by unknown mapping keys.
- Keep validation feedback immediate and clear.

#### Tasks — Input Layer

- Standardize JSON validation responses from input component.
- Detect stale export timestamps and message clearly.
- Validate required collections by selected village mode.
- Add preflight summary before schedule run.
- Detect malformed numerical fields and coerce safely when possible.
- Flag unsupported structures with guidance text.
- Distinguish warning-level vs blocking-level validation.
- Add machine-readable validation object for internal use.
- Ensure no destructive changes to user-pasted raw text.
- Preserve local draft while exposing validation hints.

#### Tasks — Mapping and Config Data

- Audit mapping coverage across known building/hero IDs.
- Create report of unmapped IDs from recent datasets.
- Normalize name consistency between mapping and color map keys.
- Validate priority map entries match schedulable IDs.
- Validate TH/BH tables align with config category keys.
- Verify new_data assets map cleanly into current schema expectations.
- Mark deprecated IDs explicitly where needed.
- Add data lint script for JSON consistency checks.
- Add duplicate detection for conflicting IDs.
- Add CI-friendly check command for data integrity.

#### Tasks — Error Presentation

- Surface high-signal error messages in app summary area.
- Include probable fix guidance for common failures.
- Show count of skipped items when mappings are missing.
- Preserve scheduling for known items even with partial unknowns.
- Keep message language plain and actionable.
- Ensure errors do not flood on every render tick.
- Add minimal deduping for repeated warnings.
- Keep severe errors sticky until new valid run.
- Log technical details only in debug mode.
- Ensure accessibility for error state indicators.

#### Acceptance Criteria

- Invalid/partial input never crashes scheduler run path.
- Unknown mappings are counted and surfaced.
- User can still generate a partial schedule when safe.
- Validation consistently reflects selected village context.
- Data lint script catches key mismatch classes.
- Validation latency remains near-instant on paste/format.
- Error copy is concise and non-technical by default.
- App retains previous valid schedule when new run fails.
- Validation artifacts documented.
- Unit tests cover at least top 10 validation branches.

### Phase 3 - UX Workflow Consistency

#### Objectives

- Keep user flow simple from paste to plan tracking.
- Improve consistency between timeline and card interactions.
- Reduce ambiguity around schedule settings.

#### Tasks — Controls and Settings

- Group schedule controls by purpose: strategy, base, boost, active time.
- Ensure every setting change has predictable rerun behavior.
- Clarify labels for LPT and SPT strategy controls.
- Preserve selected settings across sessions.
- Show current applied settings near schedule header.
- Confirm reset behavior for settings is explicit.
- Ensure active-time enable toggle reflects persisted state.
- Validate builder boost range and increments are clear.
- Avoid hidden dependencies between controls.
- Keep control defaults aligned with current baseline behavior.

#### Tasks — Smart Tracker Summary

- Verify completion, remaining, and category counts accuracy.
- Ensure duration formatting matches across views.
- Keep recommended next upgrades aligned with not-done tasks.
- Prevent done-state toggles from desyncing stats.
- Preserve recommendation stability across rerenders.
- Ensure zero-state messaging remains informative.
- Validate tracker state after strategy switch.
- Validate tracker state after village switch.
- Validate tracker state after new JSON import.
- Ensure tracker text remains concise and actionable.

#### Tasks — Timeline and Cards Sync

- Ensure selecting timeline bar toggles done-state reliably.
- Ensure card click toggles same key as timeline item.
- Keep done visual treatment consistent across both views.
- Ensure task identity survives reruns where key is unchanged.
- Confirm timeline item IDs are unique and stable.
- Guard against duplicate ID collisions in vis dataset.
- Keep tooltip detail consistent with card detail.
- Ensure keyboard and pointer interactions both work.
- Confirm no stale selections remain after rerender.
- Ensure visual updates complete within one render cycle.

#### Acceptance Criteria

- End-to-end flow from paste to plan generation is frictionless.
- Settings and views remain synchronized after multiple toggles.
- Done-state is consistent in timeline, cards, and tracker stats.
- No ambiguous strategy or time-window labels remain.
- UI behavior remains stable with large schedules.
- All key interactions are test-covered at component level.
- Accessibility checks pass for key controls.
- No regression in baseline functionality.
- UX copy reviewed for clarity.
- Phase demo approved.

### Phase 4 - Persistence Reliability and Migration Safety

#### Objectives

- Prevent data loss and accidental cross-profile state overlap.
- Keep done-state and settings persistence predictable.
- Add migration approach for key changes.

#### Tasks — Storage Schema

- Inventory all current localStorage keys and payloads.
- Define versioned schema for persisted app state.
- Add migration function for old key formats.
- Separate volatile and durable values clearly.
- Keep done-state scoped by tag, village, and strategy.
- Validate unknown or corrupted payload fallback behavior.
- Add lightweight checksum or sanity checks where practical.
- Document persistence contract for future features.
- Keep payload size within safe browser limits.
- Add cleanup policy for stale keys.

#### Tasks — Data Lifecycles

- Define when to overwrite existing done-state data.
- Preserve old done-state on new player tag automatically.
- Confirm schedule rerun does not clear done-state unnecessarily.
- Handle player tag absence with safe fallback key.
- Ensure JSON input expiry behavior is predictable.
- Ensure clearing input does not leave stale side effects.
- Add explicit user control for resetting progress.
- Keep reset action scoped and reversible if possible.
- Ensure migration runs only once per version.
- Log migration outcomes in debug mode only.

#### Acceptance Criteria

- No cross-account contamination of done-state.
- Corrupted storage never crashes app.
- Migration path preserves data where possible.
- Storage keys are documented and versioned.
- Settings survive refresh and restart reliably.
- Reset behavior is explicit and confirmed.
- Storage cleanup does not remove active profile data.
- Tests cover migrate, fallback, and corruption paths.
- Manual test matrix passes on major browsers.
- Release notes include persistence changes.

### Phase 5 - Performance and Scalability

#### Objectives

- Keep schedule generation and rendering smooth for large datasets.
- Reduce avoidable rerenders and heavy computations.
- Preserve responsiveness when toggling done-state repeatedly.

#### Tasks — Scheduler Performance

- Profile constructTasks hot paths on large inputs.
- Reduce repeated filtering/sorting through memoized helpers where safe.
- Avoid unnecessary object cloning in tight loops.
- Replace repeated linear lookups with indexed maps where beneficial.
- Keep algorithmic complexity visible in docs.
- Benchmark LPT and SPT separately for large queues.
- Record performance before and after changes.
- Avoid micro-optimizations that reduce clarity.
- Ensure optimizations do not change schedule semantics.
- Add guardrails for runaway iteration cases.

#### Tasks — UI Performance

- Memoize derived statistics with stable dependencies.
- Avoid regenerating heavy datasets unless source changed.
- Debounce expensive render-side transformations if needed.
- Minimize timeline full re-init frequency.
- Avoid repeated style injection churn where possible.
- Keep card list sorting stable and cached.
- Ensure done toggle updates are O(1)-friendly.
- Validate memory behavior after prolonged sessions.
- Keep initial load bundle impact minimal.
- Track performance budgets for key interactions.

#### Acceptance Criteria

- Schedule generation latency reduced for large samples.
- Toggle done-state remains instant on practical hardware.
- No visible UI jank on timeline refresh for target dataset size.
- Memory does not grow unbounded during normal use.
- Performance metrics are captured and documented.
- No correctness regression from optimization work.
- Build size impact remains acceptable.
- Profiling artifacts included in docs.
- Team sign-off on performance targets.
- Phase exit checklist complete.

### Phase 6 - Testing Strategy and Quality Gates

#### Objectives

- Expand coverage around scheduler correctness and app flows.
- Prevent regressions in precedence and persistence behavior.
- Add practical confidence without overbuilding test infrastructure.

#### Test Layers

- Unit tests for pure scheduler helpers.
- Unit tests for task key and duration formatting helpers.
- Unit tests for predecessor lock rules.
- Component tests for input validation and error rendering.
- Component tests for done-state toggling behavior.
- Integration tests for schedule generation workflow.
- Regression tests using fixed fixtures.
- Snapshot tests only where stable and useful.
- Manual exploratory checklist for timeline interactions.
- Build-and-smoke test prior to release.

#### Core Test Scenarios

- Valid home base data with no active-time limits.
- Valid builder base data with OTTO worker path.
- Mixed known and unknown mapping IDs.
- Input missing optional sections but still schedulable.
- Active-time window crossing midnight boundaries.
- Existing ongoing upgrades (priority 1) handling.
- Hero Hall gating for hero upgrades.
- Strategy comparison LPT vs SPT output differences.
- Persistence restore after refresh.
- Corrupted local storage fallback behavior.

#### Quality Gates

- All critical-path tests pass in CI.
- No uncaught runtime errors in basic smoke flow.
- New scheduler branches covered by targeted tests.
- Baseline regression fixtures match expected outputs.
- Manual checklist completed and signed.
- Build completes without blocking warnings/errors.
- Release checklist complete.
- Rollback instructions updated.
- Docs updated with known limitations.
- Final go/no-go review recorded.

### Phase 7 - Release and Stabilization

#### Release Tasks

- Prepare release notes with user-visible changes.
- Confirm deployment build artifacts generated cleanly.
- Validate hosted build startup and scheduling flow.
- Run post-deploy smoke checks on production URL.
- Monitor error reports and quick user feedback channels.
- Triage first-week issues daily.
- Patch critical bugs with targeted hotfixes.
- Keep release branch clean and traceable.
- Tag release milestone and archive validation evidence.
- Schedule retrospective with action items.

#### Stabilization Tasks

- Prioritize defect fixes by user impact and reproducibility.
- Backfill tests for every critical production bug fixed.
- Track follow-up enhancements separately from defects.
- Keep scope disciplined during stabilization window.
- Close open high-severity issues before next roadmap phase.
- Document workarounds for any unresolved low-priority issues.
- Review telemetry and usage patterns for pain points.
- Validate persistence behavior after prolonged real-world usage.
- Review performance in real datasets from active users.
- Finalize stabilization summary report.

#### Acceptance Criteria

- Release deploys without rollback.
- Core user journey works in production.
- No unresolved critical severity defects.
- Hotfix process validated.
- Stabilization report accepted.

---

## Future Evolution: Personal Smart CoC Assistant (Phases 8-15)

**Vision Statement:** Transform the current web-based tracker into a personal, adaptive desktop assistant with multi-objective planning, passive state awareness, live recommendations, multi-village support, and automated ingestion via screenshot/OCR. This evolution shifts from "static optimizer" to "intelligent companion" that adapts to real-world usage patterns.

**Platform Shift:** Desktop app (Electron or native Windows) + local Windows automation service for background monitoring and OCR ingestion.

**Product Type:** Personal assistant (not public-first) - optimized for single-user, multi-village, always-on scenarios.

**Smart Behavior:** All heuristics + predictions + automation + adaptive rescheduling.

### Phase 8 - Multi-Objective Optimization Engine (COMPLETED)

**Status: ✅ Complete** (March 2026)

Implemented weighted objective functions with 5 profiles (TimeMax, Balanced, HeroAvailability, ResourceSmoothing, RushMode) using greedy list-scheduling approach. All acceptance criteria met and validated.

**Note**: Phase 8 was a successful stepping stone that proved the value of multi-objective optimization. However, it revealed fundamental greedy algorithm limitations (no backtracking, suboptimal makespan, resource bunching). This led to Phase 8b.

---

### Phase 8b - Constraint Programming Scheduler (CP-SAT) Refactor

#### Objectives

Replace greedy list-scheduling algorithm with Constraint Programming (CP-SAT) solver from Google OR-Tools. This enables provably optimal scheduling while maintaining all Phase 8 functionality plus automatic "Just-In-Time Town Hall Trigger."

**Why this matters**:
- Greedy algorithm can't look ahead; often makes suboptimal task assignments
- CP-SAT explores millions of valid schedules to find the optimal one
- Automatically determines when to schedule Town Hall upgrade (no manual intervention)
- Resource smoothing works without hardcoded farming rates
- Provably minimizes builder idle time while respecting all constraints

#### Tasks

**Task 1: OR-Tools WASM Integration**
- Install google-ortools npm package (WASM build)
- Create src/solvers/cpsat-scheduler-base.js with CP model setup
- Verify solver can solve trivial scheduling problem (2 tasks, 1 builder)

**Task 2: Task Graph to CP Variables**
- Implement task-to-interval conversion in src/models/task-graph.js
- For each task: create interval variable (start, duration, end)
- For each task: create worker assignment variable (0, 1, or 2)
- Handle derived values (end = start + duration)

**Task 3: Hard Constraints (Precedence, Capacity, Sleep)**
- **Precedence**: For each predecessor, add constraint: start[i] >= end[predecessor]
- **Worker Capacity**: Add cumulative constraint (max 3 concurrent tasks)
- **Sleep Window**: For each task, add constraint: start time not in [23:00, 07:00]
- Test each constraint independently

**Task 4: Soft Penalties (Resource Smoothing, Idle Time, Weighted Completion)**
- **Weighted Completion Time**: Σ(weight[i] × end[i]) with priority tiers (Tier 1-6)
- **Daily Resource Smoothness**: Minimize (max_daily_cost - avg_daily_cost) per resource
- **Builder Idle Time**: Track free builder-hours and minimize
- Combine as weighted objective: W_time × completion + W_idle × idle + W_resource × smoothness

**Task 5: Solution Extraction & Validation**
- Extract solver solution to schedule array
- Implement src/solvers/cpsat-validator.js
- Validate all hard constraints post-solve (same as Task 3)
- Calculate actual objective value and compare to solver-reported

**Task 6: Unit Tests for CP Logic**
- Test: Precedence constraints respected
- Test: Worker capacity never exceeded
- Test: No tasks start during sleep
- Test: Resource smoothing penalty correct
- Test: Idle time calculation correct
- Test: Weighted completion respects priority tiers
- Test: Solver finds provably optimal solution on small instances

**Task 7: UI Integration & Backward Compatibility**
- Replace generateSchedule() to call CP-SAT solver instead of myScheduler()
- Update App.js to use new solver transparently
- Run existing scheduler.test.js tests (should pass with new solver)
- Add new tests comparing CP-SAT output to greedy on benchmarks

**Task 8: Performance Tuning & Validation**
- Benchmark solve times on test villages (TH6-TH15)
- Goal: < 5 seconds for typical village
- Verify JIT TH trigger: TH scheduled automatically when builders idle
- Verify resource smoothing: daily costs balanced
- Compare makespan quality: CP-SAT should be ≥ greedy on all test cases
- Document any solver limitations or edge cases found

#### Key Algorithm Details (See PHASE_8B_CP_SAT_SCHEDULER_SPECIFICATION.md)

**Hard Constraints**:
1. Precedence: Task $i$ starts after all predecessors complete
2. Worker Capacity: At most 3 builders active at any time
3. Sleep Window: No task can START between 23:00-07:00

**Soft Penalties** (weighted sum in objective):
1. **Weighted Completion Time**: $\sum_i \text{weight}_i \cdot \text{end}_i$ (respects 6-tier priority system)
2. **Daily Resource Smoothness**: Minimize variance of gold/elixir/dark-elixir costs across days
3. **Builder Idle Time**: Minimize free builder-hours

**Objective Function**:
$$\text{Minimize} = 1.0 \times \text{CompletionTime} + 0.001 \times \text{IdleTime} + 0.001 \times \text{ResourceSmoothing}$$

**Just-In-Time TH Trigger**:
- User provides buildings for current TH level + first batch of next TH level
- TH upgrade has weight = 50 (Tier 4, below offense/heavy defense, above heroes)
- As solver optimizes, it naturally schedules TH exactly when builders run out of parallel work
- Upon TH completion, next-level tasks unlock immediately, feeding idle builders
- Result: Automatic, provably optimal TH transition with no manual input

#### Success Criteria

- [ ] CP-SAT solver installed and builds successfully
- [ ] All hard constraints enforced (precedence, capacity, sleep)
- [ ] All soft penalties calculated correctly (completion time, resource smoothing, idle time)
- [ ] Validation tests pass (constraints verified post-solve)
- [ ] Regression tests pass (CP-SAT output ≥ greedy quality on benchmarks)
- [ ] JIT TH trigger verified on 3+ realistic test villages
- [ ] Resource smoothing verified (expensive upgrades spaced across days)
- [ ] Sleep window respected (no tasks start during 23:00-07:00)
- [ ] Performance acceptable (solve < 5s on typical village)
- [ ] UI generates schedules via CP-SAT (all generateSchedule calls routed through solver)
- [ ] Existing tests pass (backward compatibility maintained)
- [ ] Documentation complete (specification + code comments)

#### Timeline Estimate

- Task 1: 30 minutes
- Task 2: 2 hours
- Task 3: 1.5 hours
- Task 4: 2 hours
- Task 5: 1 hour
- Task 6: 1.5 hours
- Task 7: 1 hour
- Task 8: 1.5 hours

**Total: 11-12 hours** (1.5 days focused work)

---

### Phase 9 - Multi-Village Persistent Model

#### Objectives

Support tracking 3+ villages independently with fast switching, per-village strategy presets, and isolated progress tracking.

#### Tasks

**Village Data Model:**
- Create persistent village store (new service layer in src/services/villageStore.js)
- Each village: {id, name, tag, jsonData, strategy, doneKeys, activeTime, lastUpdate}
- Add village CRUD operations (create, read, update, delete, switch)
- Migrate current single-village state to multi-village structure

**UI Integration:**
- Add village switcher dropdown in App.js header (shows village name + tag)
- Village quick-add from JSON paste (auto-detect tag, prompt for nickname)
- Per-village settings persistence (strategy, boost, active-time)
- Visual indicator for active village throughout UI

**State Management:**
- Connect App.js to villageStore for current village state
- Lazy-load village data on switch (don't load all villages at startup)
- Add village-scoped done-state keys (already partially implemented in Phase 4)
- Background sync timestamps to detect stale data

#### Acceptance Criteria

- Can manage 5+ villages without performance degradation
- Switching villages updates all UI state (schedule, done, settings)
- Per-village strategies persist across sessions
- No cross-village done-state contamination
- Village list shows last-active timestamp for each

---

### Phase 10 - Real-Time Builder Available Assistant

#### Objectives

Add live "next action queue" that continuously updates as timers expire, showing "start this upgrade now" recommendations without manual regeneration.

#### Tasks

**Live Timer System:**
- Add background timer service (tracks all in-progress upgrades)
- Emit "builder available" events when tasks complete
- Update next-action queue automatically on builder-free event
- Show countdown timers to next available builder in UI

**Next-Action Queue:**
- Display top 3-5 recommended "start now" tasks in App.js dashboard
- Show recommendation reason: ("optimal time slot", "hero will lock soon", "resource cap approaching")
- Highlight urgency (green: start anytime, yellow: start soon, red: start now or resource waste)
- Click-to-start integration (future: auto-capture if companion service connected)

**Smart Recommendations:**
- Factor in current resource levels (prefer tasks that drain excess resources)
- Avoid hero overlaps if war detected (from companion service or manual flag)
- Recompute queue when user marks task as started/completed
- Persist queue state across app restarts

#### Acceptance Criteria

- Next-action queue updates automatically as timers expire
- Recommendations explain why each task is suggested
- Urgency levels accurately reflect resource waste risk
- Queue persists across browser/app restarts
- No stale recommendations after manual progress updates

---

### Phase 11 - Adaptive Rescheduling Engine

#### Objectives

Automatically recompute schedule when upgrades aren't started on time, builders go idle, or unexpected tasks are detected. Eliminate need for manual "Generate Schedule" clicks during active play.

#### Tasks

**Drift Detection:**
- Compare planned task start times to current timestamp
- Flag tasks that should have started but didn't (user delayed)
- Detect idle builders (no in-progress task when one was planned)
- Trigger automatic recompute when drift exceeds threshold (e.g., 2+ hours)

**Recompute Logic:**
- Lock in-progress tasks as fixed constraints
- Reschedule pending tasks from current timestamp
- Preserve done-state and user-marked priorities
- Show diff summary: "3 tasks rescheduled due to drift"

**User Control:**
- Auto-recompute toggle in settings (default: ON)
- Manual "Sync Now" button for immediate recompute
- Show last sync timestamp in UI
- Notification when significant drift detected ("Schedule is 6 hours behind reality")

**Integration Points:**
- Hook into builder-available events from Phase 10
- Merge with OCR state updates from Phase 12 (when available)
- Respect user overrides (manually delayed tasks shouldn't auto-reschedule immediately)

#### Acceptance Criteria

- Schedule auto-updates when drift exceeds threshold
- In-progress tasks remain locked during recompute
- User can disable auto-recompute and use manual sync
- Drift notifications appear when schedule deviates significantly
- Recompute preserves done-state and priority overrides

---

### Phase 12 - Rush Mode Policy Engine

#### Objectives

Implement focused optimization mode for "rush to TH upgrade" scenarios - prioritize critical buildings until gate condition met, then resume balanced mode.

#### Tasks

**Rush Mode Configuration:**
- Define rush targets in scheduler logic (e.g., "upgrade Barracks to L12, Camps to L8")
- Support TH-level-specific rush templates (TH10→11 has different critical path than TH13→14)
- User can select rush target ("Rush to TH11") from settings
- Show progress toward rush goal (5/8 critical buildings complete)

**Scheduler Integration:**
- Override objective weights when rush mode active
- Prioritize rush-critical buildings with 10x weight multiplier
- Allow non-critical upgrades only when all builders busy with critical path
- Auto-transition to balanced mode when rush condition satisfied

**UI Indicators:**
- Rush mode badge in header when active
- Critical path tasks highlighted in timeline/cards (red border)
- Progress bar: "6 days until TH11 unlocked (5/8 critical upgrades done)"
- Exit rush mode button (resume normal optimization)

**Rush Templates:**
- Prebuilt templates for common TH transitions (TH9→10, TH10→11, etc.)
- Load template from community-maintained JSON config
- Custom rush mode: user manually selects critical buildings

#### Acceptance Criteria

- Rush mode prioritizes critical buildings over non-critical
- Progress tracker shows completion toward rush goal
- Schedule auto-transitions to balanced mode when goal reached
- Templates exist for TH8→15 transitions
- User can create custom rush configurations

---

### Phase 13 - Windows Companion Service (OCR Ingestion)

#### Objectives

Build local Windows service that detects open CoC window, captures builder-menu screenshots, OCR-parses current state, and syncs to tracker app. Enables passive state awareness without manual JSON export.

#### Tasks

**Service Architecture:**
- New module: src-companion/ (Node.js service, runs outside React UI)
- Detect Clash of Clans window (via window title matching)
- Capture builder menu screenshots on interval (every 5 minutes when CoC active)
- Store screenshots locally for review/debugging

**OCR Pipeline:**
- Integrate Tesseract.js or Windows OCR API
- Parse builder names, levels, and timer text from screenshots
- Extract upgrade names and remaining times
- Map OCR output to task identifiers (fuzzy match against mapping data)

### Phase 9 - Multi-Village Persistent Model

#### Objectives

Support tracking 3+ villages independently with fast switching, per-village strategy presets, and isolated progress tracking.

#### Tasks

**Village Data Model:**
- Create persistent village store (new service layer in src/services/villageStore.js)
- Each village: {id, name, tag, jsonData, strategy, doneKeys, activeTime, lastUpdate}
- Add village CRUD operations (create, read, update, delete, switch)
- Migrate current single-village state to multi-village structure

**UI Integration:**
- Add village switcher dropdown in App.js header (shows village name + tag)
- Village quick-add from JSON paste (auto-detect tag, prompt for nickname)
- Per-village settings persistence (strategy, boost, active-time)
- Visual indicator for active village throughout UI

**State Management:**
- Connect App.js to villageStore for current village state
- Lazy-load village data on switch (don't load all villages at startup)
- Add village-scoped done-state keys (already partially implemented in Phase 4)
- Background sync timestamps to detect stale data

#### Acceptance Criteria

- Can manage 5+ villages without performance degradation
- Switching villages updates all UI state (schedule, done, settings)
- Per-village strategies persist across sessions
- No cross-village done-state contamination
- Village list shows last-active timestamp for each

---

### Phase 10 - Real-Time Builder Available Assistant

#### Objectives

Add live "next action queue" that continuously updates as timers expire, showing "start this upgrade now" recommendations without manual regeneration.

#### Tasks

**Live Timer System:**
- Add background timer service (tracks all in-progress upgrades)
- Emit "builder available" events when tasks complete
- Update next-action queue automatically on builder-free event
- Show countdown timers to next available builder in UI

**Next-Action Queue:**
- Display top 3-5 recommended "start now" tasks in App.js dashboard
- Show recommendation reason: ("optimal time slot", "hero will lock soon", "resource cap approaching")
- Highlight urgency (green: start anytime, yellow: start soon, red: start now or resource waste)
- Click-to-start integration (future: auto-capture if companion service connected)

**Smart Recommendations:**
- Factor in current resource levels (prefer tasks that drain excess resources)
- Avoid hero overlaps if war detected (from companion service or manual flag)
- Recompute queue when user marks task as started/completed
- Persist queue state across app restarts

#### Acceptance Criteria

- Next-action queue updates automatically as timers expire
- Recommendations explain why each task is suggested
- Urgency levels accurately reflect resource waste risk
- Queue persists across browser/app restarts
- No stale recommendations after manual progress updates

---

### Phase 11 - Adaptive Rescheduling Engine

#### Objectives

Automatically recompute schedule when upgrades aren't started on time, builders go idle, or unexpected tasks are detected. Eliminate need for manual "Generate Schedule" clicks during active play.

#### Tasks

**Drift Detection:**
- Compare planned task start times to current timestamp
- Flag tasks that should have started but didn't (user delayed)
- Detect idle builders (no in-progress task when one was planned)
- Trigger automatic recompute when drift exceeds threshold (e.g., 2+ hours)

**Recompute Logic:**
- Lock in-progress tasks as fixed constraints
- Reschedule pending tasks from current timestamp
- Preserve done-state and user-marked priorities
- Show diff summary: "3 tasks rescheduled due to drift"

**User Control:**
- Auto-recompute toggle in settings (default: ON)
- Manual "Sync Now" button for immediate recompute
- Show last sync timestamp in UI
- Notification when significant drift detected ("Schedule is 6 hours behind reality")

**Integration Points:**
- Hook into builder-available events from Phase 10
- Merge with OCR state updates from Phase 12 (when available)
- Respect user overrides (manually delayed tasks shouldn't auto-reschedule immediately)

#### Acceptance Criteria

- Schedule auto-updates when drift exceeds threshold
- In-progress tasks remain locked during recompute
- User can disable auto-recompute and use manual sync
- Drift notifications appear when schedule deviates significantly
- Recompute preserves done-state and priority overrides

---

### Phase 12 - Rush Mode Policy Engine

#### Objectives

Implement focused optimization mode for "rush to TH upgrade" scenarios - prioritize critical buildings until gate condition met, then resume balanced mode.

#### Tasks

**Rush Mode Configuration:**
- Define rush targets in scheduler logic (e.g., "upgrade Barracks to L12, Camps to L8")
- Support TH-level-specific rush templates (TH10→11 has different critical path than TH13→14)
- User can select rush target ("Rush to TH11") from settings
- Show progress toward rush goal (5/8 critical buildings complete)

**Scheduler Integration:**
- Override objective weights when rush mode active
- Prioritize rush-critical buildings with 10x weight multiplier
- Allow non-critical upgrades only when all builders busy with critical path
- Auto-transition to balanced mode when rush condition satisfied

**UI Indicators:**
- Rush mode badge in header when active
- Critical path tasks highlighted in timeline/cards (red border)
- Progress bar: "6 days until TH11 unlocked (5/8 critical upgrades done)"
- Exit rush mode button (resume normal optimization)

**Rush Templates:**
- Prebuilt templates for common TH transitions (TH9→10, TH10→11, etc.)
- Load template from community-maintained JSON config
- Custom rush mode: user manually selects critical buildings

#### Acceptance Criteria

- Rush mode prioritizes critical buildings over non-critical
- Progress tracker shows completion toward rush goal
- Schedule auto-transitions to balanced mode when goal reached
- Templates exist for TH8→15 transitions
- User can create custom rush configurations

---

### Phase 13 - Windows Companion Service (OCR Ingestion)

#### Objectives

Build local Windows service that detects open CoC window, captures builder-menu screenshots, OCR-parses current state, and syncs to tracker app. Enables passive state awareness without manual JSON export.

#### Tasks

**Service Architecture:**
- New module: src-companion/ (Node.js service, runs outside React UI)
- Detect Clash of Clans window (via window title matching)
- Capture builder menu screenshots on interval (every 5 minutes when CoC active)
- Store screenshots locally for review/debugging

**OCR Pipeline:**
- Integrate Tesseract.js or Windows OCR API
- Parse builder names, levels, and timer text from screenshots
- Extract upgrade names and remaining times
- Map OCR output to task identifiers (fuzzy match against mapping data)

**State Sync:**
- Expose HTTP API or IPC endpoint from companion service
- Tracker app polls for state updates (or websocket push)
- Merge OCR state with planned schedule (reconciliation in Phase 14)
- Store raw OCR logs for accuracy validation

**Deployment:**
- Installer for companion service (auto-start on Windows login)
- System tray icon with status (connected/disconnected/scanning)
- Settings panel: scanning interval, OCR confidence threshold
- Privacy: all data local-only, no cloud transmission

#### Acceptance Criteria

- Companion service detects CoC window and captures screenshots
- OCR accurately extracts builder state (>90% accuracy on test screenshots)
- Tracker app receives state updates from companion service
- Service runs in background without user intervention
- System tray icon shows connection status

---

### Phase 14 - Ingestion Reconciliation Layer

#### Objectives

Merge OCR-detected state with planned schedule and flag conflicts (started unplanned task, cancelled upgrade, timer mismatch). Provide truth reconciliation between plan and reality.

#### Tasks

**Conflict Detection:**
- Compare OCR state to planned tasks at same timestamp
- Flag discrepancies:
  - Unplanned task started (user improvised)
  - Planned task not started (user delayed)
  - Timer mismatch (OCR says 3d 2h, plan says 3d 5h)
  - Cancelled upgrade (was in progress, now not detected)

**Reconciliation UI:**
- Show conflicts in App.js dashboard ("3 unplanned tasks detected")
- Per-conflict actions: "Accept OCR state", "Keep plan", "Mark as error"
- Bulk accept: "Sync all to OCR state" (trust reality over plan)
- Review history: log of all reconciliation decisions

**State Merge Logic:**
- When OCR confident (>95% confidence): auto-accept and update plan
- When OCR low confidence: flag for user review
- When in-progress task detected: lock in as constraint for recompute
- When done task detected: add to done-state automatically

**Learning Mode:**
- Track OCR accuracy over time per building/hero type
- Adjust confidence thresholds based on historical accuracy
- Flag buildings that consistently trigger conflicts (user's custom play style)

#### Acceptance Criteria

- Conflicts detected and displayed with clear descriptions
- User can accept/reject OCR state per conflict
- High-confidence OCR updates auto-merge without prompts
- Reconciliation history viewable for audit
- Plan updates to match reality after conflict resolution

---

### Phase 15 - Advanced Tracking UX and Insights

#### Objectives

Extend timeline and cards UI with rich context: recommendation reasons, hero-lock warnings, resource-pressure indicators, and historical insights.

#### Tasks

**Recommendation Reasons:**
- Show "why this task now" in next-action queue
- Tooltip on timeline items: "Critical path for rush to TH11", "Minimizes hero downtime", "Uses excess gold"
- Color-code by recommendation strength (green: aligned with plan, yellow: acceptable, red: suboptimal)

**Hero-Lock Warnings:**
- Visual indicator when hero will be locked during configured war time
- "War conflict" badge on hero upgrade tasks
- Suggest alternative scheduling: "Delay 6 hours to avoid war window"

**Resource-Pressure Indicators:**
- Show when resources will cap ("Gold caps in 8 hours - start upgrade or waste 2.3M")
- Timeline heatmap: red zones = resource waste risk
- Smart trainer suggestions: "Dump 5M elixir into troop research before Lab closes"

**Historical Insights:**
- Average upgrade delay (user starts tasks 2.3 hours after plan on average)
- Builder utilization rate (80% active time, 20% idle)
- Most-delayed categories (user consistently delays defenses)
- Time-to-TH projection based on actual completion rate

**Mobile-Responsive Cards:**
- Swipe gestures for done/undo on mobile
- Collapsible category sections
- Quick-filter: "Show only next 24 hours"

#### Acceptance Criteria

- Recommendation reasons visible on hover and in queue
- Hero-lock warnings prevent war-time conflicts
- Resource-pressure indicators show waste risk accurately
- Historical insights display user's actual completion patterns
- Mobile UX supports touch gestures for common actions

---

### Phase 16 - Import/Export and Backup/Restore

#### Objectives

Provide local-first data resilience: export all villages/strategies/progress to file, restore from backup, and sync across devices (manual file transfer).

#### Tasks

**Export Functionality:**
- "Export All Data" button in settings
- Generates JSON file with all villages, strategies, done-state, settings
- Include metadata: export date, app version, checksum
- Encrypted export option (password-protected)

**Import Functionality:**
- "Import Data" button: select .json backup file
- Preview import: show villages and last-updated timestamps
- Merge strategies: replace, merge (keep newer), or skip conflicts
- Validation: checksum verification, schema version check

**Auto-Backup:**
- Daily auto-export to local backup folder
- Keep last 7 daily backups (rotate old ones)
- Background backup on major changes (added village, manual override)
- Backup location configurable in settings

**Cross-Device Sync (Manual):**
- Export on Device A, copy file to Device B, import
- Conflict resolution: keep both versions or choose one
- Sync status indicator: "Last synced 3 days ago"

#### Acceptance Criteria

- Export generates valid JSON with all user data
- Import restores data without loss
- Auto-backup runs daily without user intervention
- Encrypted export protects sensitive data
- Cross-device sync via manual file transfer works

---

### Phase 17 - Comprehensive Testing for Advanced Features

#### Objectives

Backfill unit/integration tests for Phases 8-16, ensuring adaptive features don't regress.

#### Tasks

**Scheduler Tests:**
- Multi-objective optimization: test each profile produces distinct schedules
- Rush mode: validate critical-path prioritization
- Adaptive recompute: test drift detection and in-progress task locking

**Multi-Village Tests:**
- Village switching: confirm state isolation
- Per-village strategies: verify independent settings
- Cross-village queries: ensure no data leakage

**OCR/Ingestion Tests:**
- Mock OCR output: validate parsing accuracy
- Conflict detection: test all conflict types
- Reconciliation: verify state merge logic

**UI Tests:**
- Next-action queue: test auto-updates on timer expiry
- Recommendation reasons: validate context generation
- Hero-lock warnings: confirm conflict detection

**End-to-End Tests:**
- Full flow: paste JSON → generate rush-mode schedule → simulate OCR update → reconcile conflict → verify recompute
- Multi-village flow: create 3 villages, switch between them, verify independent progress

#### Acceptance Criteria

- 50+ tests covering advanced features
- All objective profiles tested with fixtures
- OCR pipeline has 95%+ test coverage
- Multi-village switching tested with 5+ villages
- E2E tests validate full user journeys

---

## Comprehensive Verification Plan (Phases 8-17)

### Functional Verification

**Adaptive Rescheduling (Phase 11):**
- Simulate delayed builder starts (user doesn't start task on time)
- Verify automatic recompute updates "start next" suggestions without pressing generate
- Test drift threshold detection (2+ hour delay triggers auto-recompute)
- Validate in-progress tasks remain locked during recompute
- Confirm done-state preserved after adaptive reschedule

**Multi-Objective Optimization (Phase 8):**
- Generate schedules with each objective profile (Balanced, HeroAvailability, ResourceSmoothing, TimeMax, RushMode)
- Verify distinct task orderings for different profiles
- Test custom weight adjustments produce expected behavior
- Validate hero-lock constraints respected in HeroAvailability mode
- Confirm rush-critical buildings prioritized in RushMode

**Real-Time Assistant (Phase 10):**
- Start schedule, fast-forward to builder completion time
- Verify next-action queue updates automatically without manual action
- Test recommendation reasons display correctly
- Validate urgency indicators (green/yellow/red) based on resource waste risk
- Confirm queue persists across app restart

### Multi-Village Verification

**Village Switching:**
- Create 3 villages with different village data (TH levels, strategies, progress)
- Switch between villages rapidly (5+ switches in 30 seconds)
- Verify each switch loads correct village state (schedule, done-keys, settings)
- Confirm no cross-village contamination (Village A's done-state doesn't affect Village B)
- Test village deletion removes all associated data

**Independent Strategies:**
- Set Village 1 to LPT, Village 2 to SPT, Village 3 to RushMode
- Generate schedules for each village
- Switch between villages and verify strategy persists
- Modify Village 2 strategy to Balanced, switch away and back
- Confirm Village 2 now uses Balanced, others unchanged

**Performance at Scale:**
- Load 5+ villages (simulate heavy user with main + alts)
- Verify app startup time acceptable (<3 seconds)
- Test village switching remains responsive (<500ms)
- Monitor memory usage doesn't grow unbounded with more villages
- Validate localStorage size limits not exceeded (estimate <10MB total)

### OCR Pipeline Verification

**Screenshot Capture:**
- Open Clash of Clans on Windows
- Trigger companion service capture (manual or auto-interval)
- Verify screenshot saved to local folder with timestamp
- Test capture during various CoC screens (builder menu, village view)
- Confirm privacy: screenshots stored locally, not transmitted

**OCR Accuracy:**
- Collect 20 test screenshots with known builder states
- Run OCR parsing on each screenshot
- Calculate accuracy: correct detections / total builders
- Target: >90% accuracy for builder names, levels, timer text
- Identify failure patterns (small fonts, overlapping UI, partial builds)

**State Mapping:**
- OCR detects "Town Hall L14 - 10d 5h 23m"
- Verify mapped to correct task: {id: "Town_Hall", level: 14, remainingTime: 896580}
- Test fuzzy matching for variations ("TH14", "Town Hall 14", "Townhall lv14")
- Validate timer parsing for various formats (10d 5h, 23h 45m, 3m 12s)

**Conflict Detection:**
- Plan shows "Barracks L12" starting in 2 hours
- OCR detects "Barracks L11 - 3d 1h" (user started early or different task)
- Verify conflict flagged: "Unplanned task detected"
- Test reconciliation: user accepts OCR state, plan updates Barracks L12 start time
- Confirm next-action queue recalculates after reconciliation

### Quality and Integration Checks

**Build and Deploy:**
- Run `npm test -- --watchAll=false` for web app portion
- Verify all tests pass (target: 50+ tests for Phases 8-17)
- Run `npm run build` for Electron desktop app
- Verify build succeeds without warnings
- Test desktop installer on clean Windows 10/11 machine

**Companion Service:**
- Install companion service via installer
- Verify auto-starts on Windows login
- Check system tray icon shows "connected" status
- Test connection to main app (send mock OCR data, verify received)
- Confirm graceful degradation if CoC not running (service idle, no errors)

**End-to-End User Journey:**
1. Install desktop app + companion service
2. Import village JSON (TH12 with 30 pending upgrades)
3. Set objective profile to RushMode (target: TH13)
4. Generate schedule, verify critical buildings prioritized
5. Open CoC, start an upgrade from plan
6. Companion service captures state via OCR
7. App detects started task, locks it in schedule
8. Mark 2 more tasks complete manually in app
9. Simulate 6 hour time jump (adjust system clock or mock timers)
10. Verify adaptive reschedule triggers automatically
11. Check next-action queue shows new recommendations
12. Export all data, wipe app, import backup, verify restoration
13. Add second village, switch between them, confirm independence

**Performance Benchmarks:**
- Schedule generation for 100-task village: <2 seconds (any objective profile)
- Village switching: <500ms
- Next-action queue update: <200ms
- OCR processing: <3 seconds per screenshot
- Adaptive recompute with 50 pending tasks: <1 second
- App startup with 5 villages: <3 seconds
- Memory usage: <300MB sustained (main app + companion service)

### Acceptance Gates

**Phase 8 Complete:**
- [ ] All 5 objective profiles implemented
- [ ] Custom weight UI functional
- [ ] Scheduler respects constraints (hero locks, rush gates)
- [ ] Profile comparison shows distinct schedules
- [ ] 10+ tests covering multi-objective logic

**Phase 9 Complete:**
- [ ] Multi-village CRUD operations work
- [ ] Village switching tested with 5+ villages
- [ ] No cross-village contamination
- [ ] Per-village settings persist independently
- [ ] Performance acceptable with 5+ villages

**Phase 10 Complete:**
- [ ] Next-action queue updates automatically on timer expiry
- [ ] Recommendation reasons displayed
- [ ] Urgency indicators accurate
- [ ] Queue persists across restarts
- [ ] Integration with Phase 8 objective scores

**Phase 11 Complete:**
- [ ] Drift detection triggers at configured threshold
- [ ] Adaptive recompute preserves in-progress tasks
- [ ] User can disable auto-recompute
- [ ] Drift notifications display when schedule behind reality
- [ ] 5+ tests covering adaptive scenarios

**Phase 12 Complete:**
- [ ] Rush mode prioritizes critical buildings
- [ ] Progress tracker shows completion toward goal
- [ ] Auto-transition to balanced mode when goal met
- [ ] Rush templates exist for TH8-15
- [ ] Custom rush configurations work

**Phase 13 Complete:**
- [ ] Companion service detects CoC window
- [ ] Screenshots captured on interval
- [ ] OCR extracts builder state >90% accuracy
- [ ] IPC/API exposes state to main app
- [ ] Installer and auto-start functional

**Phase 14 Complete:**
- [ ] Conflicts detected and displayed
- [ ] Reconciliation UI functional (accept/reject per conflict)
- [ ] High-confidence OCR auto-merges
- [ ] Reconciliation history viewable
- [ ] 10+ tests covering conflict scenarios

**Phase 15 Complete:**
- [ ] Recommendation reasons visible
- [ ] Hero-lock warnings prevent conflicts
- [ ] Resource-pressure indicators show waste risk
- [ ] Historical insights display usage patterns
- [ ] Mobile-responsive touch gestures (if web app maintained)

**Phase 16 Complete:**
- [ ] Export generates valid JSON backup
- [ ] Import restores all data without loss
- [ ] Auto-backup runs daily
- [ ] Encrypted export protects data
- [ ] Cross-device manual sync works

**Phase 17 Complete:**
- [ ] 50+ tests pass for Phases 8-17
- [ ] E2E user journey tested successfully
- [ ] Performance benchmarks met
- [ ] No critical bugs in alpha testing
- [ ] Documentation complete for all new features

---

## Evolution Dependency Map

**Phase 8** (Multi-objective) can start independently after Phase 7  
**Phase 9** (Multi-village) depends on Phase 4 persistence model  
**Phase 10** (Real-time assistant) depends on Phase 8 (objective scores for recommendations)  
**Phase 11** (Adaptive rescheduling) depends on Phase 10 (timer system)  
**Phase 12** (Rush mode) depends on Phase 8 (objective engine)  
**Phase 13** (Windows companion) can start in parallel with Phases 8-12  
**Phase 14** (Reconciliation) depends on Phase 13 (OCR data) + Phase 11 (recompute logic)  
**Phase 15** (Advanced UX) depends on Phases 8-14 (data from all features)  
**Phase 16** (Import/export) can start after Phase 9 (multi-village model)  
**Phase 17** (Testing) is continuous but completes after all other phases

**Critical Path:** 7 → 8 → 10 → 11 → 14 → 15 (core adaptive features)  
**Parallel Workstreams:** 9 (multi-village), 12 (rush mode), 13 (companion service)

---

## Technical Architecture Evolution

### Current Architecture (Phases 0-7)
- React SPA (Create React App)
- Client-side scheduling (scheduler.js)
- localStorage persistence
- Manual JSON input
- GitHub Pages deployment

### Target Architecture (Phases 8-17)
- **Desktop App:** Electron wrapper around React UI (or native Windows)
- **Companion Service:** Node.js background service (src-companion/)
  - Window detection (CoC process monitoring)
  - Screenshot capture (Windows Graphics Capture API)
  - OCR processing (Tesseract.js or Windows OCR)
  - IPC/HTTP API to main app
- **Data Layer:** Enhanced persistence with multi-village store
- **Scheduler Engine:** Multi-objective optimization with constraints
- **State Management:** Real-time updates via timer system + OCR sync
- **Deployment:** Installable Windows app (not web-based)

### Migration Path

**Phase 7.5 (Transition):** 
- Keep web app functional alongside desktop development
- Build Electron wrapper as new target (web app embeds in Electron)
- Add electron-specific features gradually (file system, background service IPC)

**Phase 8-12:**
- Develop advanced features in web app first (easier iteration)
- Test in browser, then validate in Electron
- Companion service develops independently, consumed via API

**Phase 13+:**
- Full desktop app experience required (companion service + OCR)
- Web version frozen at Phase 7 baseline
- Desktop version becomes primary distribution

---

## Product Vision Alignment

**Current Product (Phases 0-7):**  
Static optimizer with manual input and tracking

**Evolved Product (Phases 8-17):**  
Personal adaptive assistant with passive awareness and live guidance

**Key Shift:**  
From "user initiates all actions" to "app suggests actions based on real-time state"

**Value Proposition:**  
"Your CoC advisor that tells you exactly what to start when a builder finishes, adapts to your actual play patterns, and keeps all your villages on optimal upgrade paths without manual planning."

---

## Cross-Cutting Technical Decisions

- Maintain existing public API of schedule generation where possible.
- Prefer additive refactors over breaking rewrites.
- Keep data source files as JSON under source control.
- Keep local-only app model and avoid backend assumptions.
- Use deterministic sorting tie-breakers everywhere relevant.
- Keep duration units in seconds across scheduler core.
- Keep conversion to display strings at view boundaries.
- Centralize task key generation and reuse across components.
- Keep strategy options limited to LPT/SPT in current cycle.
- Maintain explicit base mode branching with shared helper utilities.

## Dependency Map

- Phase 1 depends on Phase 0 baseline fixtures.
- Phase 2 can start with Phase 0 outputs but must align with Phase 1 API updates.
- Phase 3 depends on Phase 1 and Phase 2 stable data contracts.
- Phase 4 depends on Phase 3 interaction model and existing key patterns.
- Phase 5 can run in parallel after Phase 1 correctness locks.
- Phase 6 begins early but completes after Phases 1-5.
- Phase 7 requires successful quality gates from Phase 6.
- Data linting supports Phases 1 and 2.
- Persistence migration must be complete before final release.
- Documentation updates are continuous, finalized in Phase 7.

## Risks and Mitigations

### Risk Register

- Risk: Scheduler behavior changes unintentionally during refactor.
- Mitigation: Baseline fixtures plus deterministic regression tests.

- Risk: Unknown mapping IDs cause silent schedule gaps.
- Mitigation: Structured warnings and skipped-item counters.

- Risk: Local storage key changes break existing progress.
- Mitigation: Versioned migration and fallback logic.

- Risk: Timeline performance degrades on large datasets.
- Mitigation: Profiling, memoization, and render-path guards.

- Risk: Active-time edge cases create invalid task windows.
- Mitigation: Boundary tests and explicit rollover handling.

- Risk: Hero prerequisite logic fails on rare data shapes.
- Mitigation: Dedicated fixtures for Hero Hall dependencies.

- Risk: UI state desync between timeline and cards.
- Mitigation: Canonical task key helper and shared toggle pathway.

- Risk: Debug logging leaks into production experience.
- Mitigation: Strict debug gating and lint checks.

- Risk: Scope creep delays release.
- Mitigation: Non-goal enforcement and phase sign-offs.

- Risk: Regression in builder-base specific logic.
- Mitigation: Separate builder-focused fixture and scenario tests.

## Milestone Plan

### Milestone M1 - Baseline Locked

- Complete Phase 0 artifacts.
- Approve deterministic fixture set.
- Sign off on known issues list.
- Confirm roadmap sequencing.
- Exit with no behavior changes merged.

### Milestone M2 - Core Correctness Ready

- Complete Phase 1 tasks.
- Remove side-effect scheduler invocation.
- Validate predecessor and worker logic.
- Pass all scheduler regression fixtures.
- Obtain technical review sign-off.

### Milestone M3 - Input and UX Stable

- Complete Phase 2 and Phase 3.
- Input validation and warnings finalized.
- UI controls and state sync validated.
- Done-state workflow verified across views.
- Complete product review sign-off.

### Milestone M4 - Persistence and Performance

- Complete Phase 4 and Phase 5.
- Storage migration and cleanup validated.
- Performance targets met for target datasets.
- Document tuning outcomes.
- Obtain release-readiness sign-off.

### Milestone M5 - Release Complete

- Complete Phase 6 and Phase 7.
- Quality gates passed.
- Production deploy verified.
- Stabilization window closed.
- Final retrospective completed.

## Work Breakdown by Component

### Scheduler Component

- Harden task creation boundaries and assumptions.
- Canonicalize key generation and use in all schedule outputs.
- Stabilize sorting and tie-break behavior.
- Protect from infinite loops with diagnosable metadata.
- Ensure active-time window semantics are explicit.
- Maintain compatibility with current App call signature.
- Strengthen hero and building dependency handling.
- Keep worker assignment deterministic.
- Add tests around predecessor graph edge cases.
- Document known limitations.

### App Component

- Centralize schedule run orchestration.
- Keep error handling resilient and user-readable.
- Ensure state transitions are atomic where necessary.
- Align tracker stats with canonical task list.
- Prevent stale state from previous runs.
- Keep settings persistence explicit and predictable.
- Preserve selected strategy and village behaviors.
- Guard against invalid JSON-run attempts.
- Improve run flow clarity for users.
- Keep render performance acceptable.

### Timeline Component

- Ensure unique stable IDs for items.
- Keep select-to-toggle flow robust.
- Minimize expensive full reinitializations.
- Align done-state visuals with cards.
- Ensure start/end time display consistency.
- Preserve accessibility basics in interaction.
- Keep style injection controlled and deterministic.
- Validate with large schedule datasets.
- Keep fallback color behavior predictable.
- Document timeline-specific limitations.

### Cards Component

- Maintain sort by chronological order.
- Keep duration and date formatting consistent.
- Ensure done-state styling and click affordance clarity.
- Keep progress bar calculations numerically stable.
- Prevent layout breakage with long names.
- Ensure worker and iteration details remain visible.
- Keep rendering lightweight for long lists.
- Align aria labels with displayed values.
- Preserve click behavior parity with timeline.
- Validate with mixed short/long duration tasks.

### Active Time Component

- Keep input constraints strict but user-friendly.
- Ensure minimum range enforcement remains consistent.
- Handle empty/partial time values safely.
- Persist only valid payloads when enabled.
- Keep disabled mode semantics explicit.
- Validate boundary values and rollover assumptions.
- Ensure integration with scheduler start/end strings.
- Surface invalid states gracefully.
- Keep local storage interactions safe.
- Test state restoration across reloads.

## Documentation Deliverables

- Update README with scheduler strategy behavior summary.
- Add troubleshooting guide for import and mapping issues.
- Add persistence key and migration notes.
- Add active-time semantics guide with examples.
- Add known limitations and non-goals section.
- Add release notes template for each milestone.
- Add performance benchmark summary.
- Add regression fixture usage instructions.
- Add contributor notes for data file updates.
- Keep docs concise and implementation-aligned.

## Backlog Prioritization (Post-Phase-7 Web App Enhancements)

**Note:** The primary evolution roadmap is captured in Phases 8-17 (Personal Desktop Assistant). The items below are incremental improvements to the Phase 0-7 web-based tracker for users who prefer to continue using the web version.

### High Priority

- Improve recommendation ranking transparency.
- Add better explanation for skipped/unmapped tasks.
- Refine strategy labels and help text.
- Add optional filter by category in tracker summary.
- Improve zero-state onboarding hints.

### Medium Priority

- Export/import done-state snapshot (lightweight version of Phase 16).
- Optional compact mode for large card lists.
- Add schedule diff view between LPT and SPT.
- Improve timeline tooltip detail density.
- Add quick jump to next pending task.

### Low Priority

- Theme polish and spacing refinements.
- Additional locale/date formatting options.
- Optional persisted custom category groupings.
- Optional charting of completion trend over time.
- Optional keyboard shortcut enhancements.

**Migration Path:** Users can continue using the web app (Phases 0-7 baseline) while desktop app (Phases 8-17) develops in parallel. Web app remains maintained but frozen at Phase 7 feature set once desktop development begins.

## Definition of Done

**Phases 0-7 (Web App Stabilization):**
- Baseline scheduler remains implementation reference and still operational.
- Core correctness issues resolved with tests.
- Input validation and errors are clear and non-blocking when possible.
- Timeline, cards, and tracker remain synchronized.
- Persistence is stable with migration safety.
- Performance targets achieved for target datasets.
- Documentation reflects actual behavior.
- Release validated in production.
- Stabilization completed with no critical open defects.
- Roadmap closure accepted by owner.

**Phases 8-17 (Desktop Assistant Evolution):**
- Multi-objective optimization produces measurably different schedules for each profile
- Multi-village support handles 5+ villages without performance degradation
- Real-time next-action queue updates automatically as timers expire
- Adaptive rescheduling syncs plan to reality within configured drift threshold
- Rush mode prioritizes critical path and transitions back to balanced mode
- Companion service detects CoC window and extracts state via OCR (>90% accuracy)
- Reconciliation UI resolves conflicts between plan and reality
- Advanced tracking UX provides contextual guidance and warnings
- Import/export preserves all user data without loss
- Desktop app installs cleanly on Windows 10/11
- 50+ tests pass covering all advanced features
- End-to-end user journey validated
- Performance benchmarks met (schedule <2s, switching <500ms, OCR <3s)
- Alpha testing complete with no critical bugs

## Implementation Checklist (Actionable Summary)

**Phases 0-7 (Completed):**
- ✅ Capture baseline fixtures and metrics.
- ✅ Remove scheduler module side-effect execution.
- ✅ Canonicalize task key helper across app.
- ✅ Add structured scheduler error handling.
- ✅ Strengthen predecessor lock validation.
- ✅ Harden active-time boundary logic.
- ✅ Add input preflight validation summary.
- ✅ Add mapping coverage report and lint checks.
- ✅ Align timeline and cards done toggle identity.
- ✅ Implement storage schema versioning and migration.
- ✅ Add corruption-safe local storage fallback.
- ✅ Profile and optimize scheduler hot paths.
- ✅ Profile and optimize timeline rerender triggers.
- ✅ Expand unit and integration tests for critical flows.
- ✅ Run release checklist and deploy verification.
- ✅ Execute stabilization triage and closeout report.

**Phases 8-17 (Planned):**
- [ ] Define 5 objective profiles with weighted scoring in scheduler
- [ ] Create multi-village store with CRUD operations
- [ ] Build real-time timer service and next-action queue
- [ ] Implement drift detection and adaptive recompute
- [ ] Add rush mode with critical-path templates
- [ ] Develop Windows companion service for CoC window detection
- [ ] Integrate OCR pipeline (Tesseract or Windows OCR)
- [ ] Build reconciliation layer for plan/reality conflicts
- [ ] Extend UI with recommendation reasons and warnings
- [ ] Implement import/export with auto-backup
- [ ] Create Electron wrapper or native Windows container
- [ ] Package desktop installer with companion service
- [ ] Write 50+ tests covering all new features
- [ ] Conduct alpha testing with multi-village users
- [ ] Validate E2E journey from install to adaptive reschedule

## Sign-Off Matrix

**Phases 0-7 (Web App):**
- Owner sign-off required for phase completion.
- Technical sign-off required for scheduler changes.
- UX sign-off required for workflow control changes.
- QA sign-off required for release candidate promotion.
- Release sign-off required before deployment.
- Post-release sign-off required after stabilization.
- All sign-offs documented in project notes.

**Phases 8-17 (Desktop Assistant):**
- Architecture sign-off required before Phase 8 (Electron vs. native decision)
- Companion service design sign-off required before Phase 13
- OCR accuracy threshold approval required for Phase 14
- Alpha testing sign-off required before Phase 17 completion
- Privacy/security review required before public release
- Performance benchmark validation required throughout
- All sign-offs documented with rationale for future reference

**General:**
- Exceptions require explicit owner approval.
- Deferred items tracked in backlog with rationale.
- Final sign-off closes current phase and authorizes next phase execution.

---

## Execution Roadmap Summary

### Current State (March 2026)
✅ **Phases 0-7 Complete** - Web-based tracker with:
- Stable scheduler with LPT/SPT strategies
- Versioned persistence with corruption protection
- Performance optimization (indexed lookups, incremental timeline updates)
- 11 passing tests covering core functionality
- Comprehensive release documentation

### Next Steps (Phase 8+)

**Immediate (Phase 8-9):**
1. **Decision Point:** Electron vs. native Windows for desktop wrapper
2. **Architecture:** Design multi-village data model and objective scoring system
3. **Prototyping:** Build multi-objective optimizer in current web app (easier iteration)
4. **Validation:** Test objective profiles with real village data

**Near-Term (Phase 10-12):**
1. Implement real-time timer system and next-action queue
2. Build adaptive rescheduling engine
3. Add rush mode templates for TH8-15
4. Continue testing in web app, prepare for Electron migration

**Mid-Term (Phase 13-14):**
1. Develop Windows companion service (Node.js background service)
2. Integrate OCR pipeline (Tesseract or Windows OCR API)
3. Build reconciliation layer for conflict resolution
4. Test with alpha users (OCR accuracy feedback loop)

**Long-Term (Phase 15-17):**
1. Polish advanced tracking UX with insights
2. Implement import/export with auto-backup
3. Package desktop installer
4. Comprehensive testing and alpha release
5. Gather user feedback for refinement

### Success Criteria

**Web App (Phases 0-7):** ✅ Achieved
- Stable, tested, deployed, documented

**Desktop Assistant (Phases 8-17):** 🎯 Target
- Personal assistant that tells user "what to start now"
- Adapts to real play patterns (delays, improvisations)
- Tracks multiple villages independently
- Passive awareness via OCR (no manual JSON export)
- Local-first privacy (all data on user's machine)
- Performance: <2s schedule generation, <500ms switching, >90% OCR accuracy

### Timeline Estimate (Phases 8-17)

**Aggressive (6-9 months):**
- 2-3 weeks per phase
- Full-time development
- Parallel workstreams (multi-village + companion service)

**Moderate (12-18 months):**
- 1 month per phase
- Part-time development
- Sequential phases with overlap

**Conservative (18-24 months):**
- 6-8 weeks per phase
- Hobby pace development
- Full validation and alpha testing between phases

### Risk Mitigation

**High-Risk Items:**
- OCR accuracy (<90% would require fallback to manual input)
- Electron bundle size (could impact performance)
- Windows API compatibility (different Windows versions)
- User adoption (desktop install friction vs. web accessibility)

**Mitigation Strategies:**
- Early OCR prototyping with real screenshots (Phase 13 Week 1)
- Electron performance benchmarking before Phase 10 migration
- Test on Windows 10/11 throughout development
- Maintain web app as lightweight alternative

---

## Document History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-28 | 1.0 | Initial consolidation plan (Phases 0-7) | jrmuy |
| 2026-03-01 | 2.0 | Added Phases 8-17 (Desktop Assistant evolution) | jrmuy |

**Next Review:** After Phase 7 deployment (March 2026) to finalize Phase 8 start date

---

## Appendix: Quick Start Guide

### For New Contributors

**Understanding This Plan:**
1. **Phases 0-7:** Already complete - web-based tracker on GitHub Pages
2. **Phases 8-17:** Future evolution - desktop assistant with OCR

**Current Codebase Tour:**
- `src/scheduler.js` - Core scheduling engine (LPT/SPT algorithms)
- `src/App.js` - Main React component (state management, UI orchestration)
- `src/BuilderTimeline.jsx` - Gantt chart timeline visualization
- `src/TimelineCards.jsx` - Card-based schedule view
- `src/persistence.js` - Versioned localStorage layer
- `docs/` - All planning and release documentation

**Running Locally:**
```bash
npm install
npm start         # Dev server on localhost:3000
npm test          # Run 11 tests
npm run build     # Production build
npm run deploy    # Deploy to GitHub Pages
```

**Contributing to Phase 8+:**
1. Read Phases 8-17 objectives in this document
2. Start with multi-objective optimizer (Phase 8) - pure scheduler extension
3. Test in web app before migrating to Electron
4. Follow verification plan in each phase acceptance criteria

### For Users

**Current Product (Phases 0-7):**
- Visit: https://sambro2901.github.io/coc-upgrade-optimizer/
- Paste village JSON, generate schedule, track progress
- All data stored locally in browser
- No installation required

**Future Product (Phases 8-17):**
- Desktop app with installer (Windows)
- Multi-village tracking
- Live recommendations as builders finish
- Auto-sync from CoC via OCR
- Release TBD (est. 12-24 months from March 2026)

**Stay Updated:**
- Watch this repository for releases
- Check `docs/RELEASE_NOTES.md` for version history
- Phase 8+ development announced when Phase 7 fully stabilized

---

**End of Plan Document**
