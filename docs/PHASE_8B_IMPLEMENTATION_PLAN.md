# Phase 8b Implementation Plan & Task Breakdown

**Overview**: Replace greedy list-scheduling with Google OR-Tools CP-SAT constraint programming solver

**Total Estimated Effort**: 11-12 hours (1.5 days focused work)

---

## 1. Task Breakdown & Sequencing

### Task 1: OR-Tools WASM Integration (30 min)
**Goal**: Get OR-Tools solver working in browser environment

**Subtasks**:
- [ ] Install `google-ortools` npm package (WASM build)
- [ ] Create `src/solvers/` directory
- [ ] Import `google-ortools` in a test file
- [ ] Verify solver can be instantiated and methods accessible
- [ ] Create trivial test: solve "minimize X where X >= 10" (answer: 10)

**Deliverable**: Working OR-Tools import with proof-of-concept solve

**Acceptance**: `jest` test passes on trivial constraint problem

---

### Task 2: Task Graph to CP Variables (2 hours)
**Goal**: Convert task array to CP interval variables and worker assignments

**Subtasks**:
- [ ] Update `src/models/task-graph.js` to create `IntervalVariable` for each task
  - `intervalVar = { start: IntVar, duration: fixed, end: IntVar }`
  - OR-Tools: `model.newIntervalVar(start, end, duration, name)`
- [ ] Create `WorkerVar` for each task (domain: 0-2 for 3 builders)
  - OR-Tools: `model.newIntVar(0, 2, name)`
- [ ] Store mapping: `taskIndex → (intervalVar, workerVar)`
- [ ] Validate on test case (simple 5-task example)

**Deliverable**: Task→Variable conversion function (`tasks → cpModel + varMap`)

**Acceptance**: Variable count matches task count; OR-Tools model accepts variables

---

### Task 3: Hard Constraints - Precedence, Capacity, Sleep (1.5 hours)
**Goal**: Implement the 3 hard constraints that define valid schedules

**Subtasks - Precedence**:
- [ ] For each task with predecessors:
  - Extract predecessor interval end time
  - Add constraint: `task.start >= predecessor.end`
  - OR-Tools: `model.add(taskStart >= predEnd)`

**Subtasks - Worker Capacity**:
- [ ] Create cumulative constraint with intervals
  - Tasks = all interval vars
  - Demands = [1, 1, 1, ...] (each task uses 1 builder)
  - Capacity = getWorkerCount() (from village Builders Huts or OTTO)
  - OR-Tools: `model.addCumulative(intervals, demands, capacity)`

**Subtasks - Sleep Window**:
- [ ] For each task:
  - Compute hour-of-day: `(start % 86400) / 3600`
  - Add constraint: `hour >= 7 AND hour <= 22`
  - OR-Tools: `model.add(hour_of_day >= 7)` + `model.add(hour_of_day <= 22)`

**Deliverable**: Constraint setup functions in `src/solvers/cpsat-formulator.js`

**Acceptance**: Model accepts constraints; no solver errors thrown

---

### Task 4: Soft Penalties (Resource Smoothing, Idle Time, Weighted Completion) (2 hours)
**Goal**: Build objective function with 3 weighted penalty terms

**Subtasks - Weighted Completion Time**:
- [ ] Define PRIORITY_TIERS mapping: `buildingId → weight` (1-1000 range)
- [ ] For each task: `Σ weight[i] × end[i]`
- [ ] Create helper function: `calculateCompletionPenalty(tasks, weights)` → scalar

**Subtasks - Daily Resource Smoothing**:
- [ ] Group tasks by day: `day = start / 86400`
- [ ] For each resource type (gold, elixir, darkElixir):
  - Calculate daily costs: `costPerDay[d] = Σ taskCost[d]`
  - Spread metric: `max(costPerDay) - avg(costPerDay)`
- [ ] Sum across all resources
- [ ] Create helper: `calculateResourcePenalty(tasks)` → scalar

**Subtasks - Builder Idle Time**:
- [ ] Build task timeline (sort by start/end)
- [ ] For each gap when a builder is free while pending work exists:
  - Count free builder-hours
- [ ] Sum total idle hours across all builders
- [ ] Create helper: `calculateIdleTime(tasks)` → scalar

**Deliverable**: Objective function combining 3 penalties with weights

**Acceptance**: Objective value computed correctly on small test case

---

### Task 5: Solution Extraction & Schedule Format (1 hour)
**Goal**: Convert CP-SAT solution back to task schedule array

**Subtasks**:
- [ ] Query solver solution for each interval variable
  - Extract `start[i]`, `end[i]`, `worker[i]`
- [ ] Reconstruct task objects with scheduling results:
  ```javascript
  {
    ...originalTask,
    start: solution.value(intervalVar.start),
    end: solution.value(intervalVar.end),
    worker: solution.value(workerVar),
    objectiveScore: ???  // optional
  }
  ```
- [ ] Sort by start time + worker
- [ ] Return as `{ schedule, makespan, solveTime, ... }`

**Deliverable**: `extractSchedule(model, solver, varMap)` function

**Acceptance**: Schedule array format matches existing greedy scheduler output

---

### Task 6: Post-Solve Validation (1.5 hours)
**Goal**: Verify the solver's solution meets all hard constraints

**Subtasks**:
- [ ] Create `src/solvers/cpsat-validator.js`
- [ ] Implement precedence check: For each task, all predecessors complete before start
- [ ] Implement capacity check: At any moment, max 3 tasks running
- [ ] Implement sleep check: No task starts between 23:00-07:00
- [ ] Calculate objective value from extracted schedule
- [ ] Compare computed objective to solver-reported objective
- [ ] Throw errors if any constraint violated

**Deliverable**: `validateSchedule(schedule)` function

**Acceptance**: All constraints validated; objective matches solver report

---

### Task 7: Unit Tests (1.5 hours)
**Goal**: Test all major functionality with small, deterministic cases

**Tests to add to `src/solvers/cpsat-scheduler.test.js`**:
- [ ] Test 1: Precedence respected (L1 → L2 → L3 of same building)
- [ ] Test 2: Worker capacity (N concurrent max, N from village)
- [ ] Test 3: Sleep window (no starts 23:00-07:00)
- [ ] Test 4: Resource smoothing (expensive tasks spaced apart)
- [ ] Test 5: Objective calculation (weighted completion time)
- [ ] Test 6: Simple small village (3 tasks, 1 builder) → optimal schedule
- [ ] Test 7: Comparison to greedy (CP-SAT makespan ≤ greedy makespan)

**Deliverable**: Test suite with 7+ passing tests

**Acceptance**: `npm test` passing for all cpsat tests

---

### Task 8: UI Integration (1 hour)
**Goal**: Wire new solver into existing App.js code path

**Subtasks**:
- [ ] Create `src/solvers/index.js` exporting both:
  - `solveWithCPSAT(tasks, scheme, config)` (new)
  - `solveWithGreedy(tasks, scheme, config)` (legacy, for testing)
- [ ] Modify `generateSchedule()` in `src/scheduler.js`:
  - Check config flag (or always use CP-SAT)
  - Call CP-SAT solver instead of `myScheduler()`
  - Return schedule in same format as greedy
- [ ] Run existing tests (`npm test`) to ensure backward compatibility
- [ ] Update comments explaining scheduler is now CP-SAT

**Deliverable**: App.js generates schedules via CP-SAT by default

**Acceptance**: All existing tests pass; UI functional

---

### Task 9: Performance Tuning & Validation (1.5 hours)
**Goal**: Verify performance and quality on realistic villages

**Subtasks - Performance**:
- [ ] Benchmark solver on test villages (TH6, TH10, TH14, TH15)
- [ ] Measure solve time (ms)
- [ ] Goal: < 5 seconds for typical village
- [ ] If timeout: adjust solver parameters (time limit, parallel workers)

**Subtasks - Quality**:
- [ ] Compare CP-SAT makespan vs greedy on 5 test cases
- [ ] Verify CP-SAT always ≤ greedy (or within 5%)
- [ ] Manually inspect 1-2 schedules:
  - Verify JIT TH trigger (TH scheduled when builders idle)
  - Verify resource smoothness (daily costs balanced)

**Subtasks - Documentation**:
- [ ] Update scheduler.js with CP-SAT algorithm notes
- [ ] Document objective function weights and tuning guide
- [ ] Document known limitations (e.g., no task splitting across sleep)

**Deliverable**: Performance report + tuning documentation

**Acceptance**: Solve times acceptable; quality meets/exceeds greedy

---

## 2. Dependency Graph

```
Task 1 (OR-Tools) 
  ↓
Task 2 (Variables) → Task 3 (Constraints) 
  ↓                    ↓
Task 4 (Penalties)   
  ↓
Task 5 (Extraction) → Task 6 (Validation)
  ↓
Task 7 (Unit Tests)
  ↓
Task 8 (UI Integration) → Task 9 (Performance)
```

**Sequential critical path**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9  
**Parallel opportunities**: Tasks 3, 4, 6, 7 can be started earlier if Task 2 is done

---

## 3. Success Criteria Checklist

By end of Task 9, all of these should be true:

- [ ] OR-Tools installed, building, and solver instantiates
- [ ] Tasks converted to CP variables successfully
- [ ] Model enforces precedence constraints
- [ ] Model enforces worker capacity constraint
- [ ] Model enforces sleep window constraint  
- [ ] Weighted completion time penalty calculated
- [ ] Daily resource smoothing penalty calculated
- [ ] Builder idle time penalty calculated
- [ ] Solution extraction produces valid schedule format
- [ ] Validation checks all hard constraints post-solve
- [ ] 7+ unit tests passing
- [ ] All existing tests still pass (backward compatibility)
- [ ] Solve time < 5 seconds on typical village
- [ ] CP-SAT makespan ≤ greedy makespan on benchmarks
- [ ] JIT TH trigger verified on test villages
- [ ] Resource smoothing verified (expensive upgrades spaced)
- [ ] Documentation complete and up-to-date

---

## 4. Risk Mitigation

**Risk**: OR-Tools WASM too slow for browser  
**Mitigation**: Have fallback to greedy solver; test early (Task 1)

**Risk**: CP model formulation has bug, solver doesn't find feasible solution  
**Mitigation**: Start with tiny test case (2-3 tasks); incrementally add complexity

**Risk**: Resource smoothing penalty causes weird behavior (e.g., bunches other resources)  
**Mitigation**: Per-resource normalization; weight tuning via parameter sweep

**Risk**: Solver timeout on large villages (15+ buildings per resource type)  
**Mitigation**: Add time limit heuristic; investigate solver parameters (# threads, search strategy)

---

## 5. Done Definition

Phase 8b is complete when:

✅ All 9 tasks completed  
✅ All success criteria checked  
✅ No new regressions in existing tests  
✅ JIT TH trigger demonstrated on 2+ realistic villages  
✅ Performance acceptable for typical use case  
✅ Documentation updated

---

## 6. Next Phase (Phase 9)

Once Phase 8b is done:
- Multi-village persistent model (3+ villages)
- Per-village solver strategy selection
- CP-SAT scheduler supports multi-village optimization

---

