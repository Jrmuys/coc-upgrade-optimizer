# Phase 8b CP-SAT Scheduler: Quick Reference & Checklist

## File Structure (Target State)

```
src/
├── solvers/
│   ├── index.js                         (NEW - export interface)
│   ├── cpsat-scheduler.js              (NEW - main solver)
│   ├── cpsat-formulator.js             (NEW - model building)
│   ├── cpsat-validator.js              (NEW - post-solve validation)
│   └── greedy-scheduler.js             (MOVED - legacy for testing)
├── models/
│   ├── task-graph.js                   (UPDATED - add CP variables)
│   └── priority-tiers.js               (NEW - tier definitions)
├── scheduler.js                         (UPDATED - call CP-SAT instead)
└── scheduler.test.js                    (UPDATED - add CP-SAT tests)

docs/
├── PHASE_8B_CP_SAT_SCHEDULER_SPECIFICATION.md  (Reference document)
└── PHASE_8B_IMPLEMENTATION_PLAN.md            (This checklist)
```

---

## Configuration Parameters Reference

### Objective Function Weights
```javascript
const OBJECTIVE_WEIGHTS = {
  completionTime: 1.0,          // Primary: minimize makespan
  idleTime: 0.001,              // Secondary: minimize builder idle (enables JIT)
  resourceSmoothing: 0.001      // Tertiary: minimize daily variance per resource
};
```

### Priority Tier System (for weighted completion)
```javascript
const PRIORITY_TIERS = {
  1: { weight: 1000, description: "Unlockers (TH, Lab, Spell Factory)" },
  2: { weight: 500,  description: "Quick wins (upgrades < 2 days)" },
  3: { weight: 100,  description: "Core production (gold/elixir drills)" },
  4: { weight: 50,   description: "Heavy defense (mortars, cannons)" },
  5: { weight: 10,   description: "Point defense (archer towers)" },
  6: { weight: 1,    description: "Grinds (walls, storages)" }
};
```

### Sleep Window
- **Invalid window**: 23:00 to 06:59 (tasks cannot START in this window)
- **Valid window**: 07:00 to 22:59 (tasks can START)
- Implementation: `(startEpoch % 86400) / 3600` (hours) must be in [7, 22]

### Solver Parameters
```javascript
const SOLVER_PARAMS = {
  timeLimit: 30000,           // 30 second maximum solve time
  workerCount: 4,             // Parallel search threads
  logSearchProgress: false,    // Disable OR-Tools verbose logging
  thoroughnessLevel: 2        // Balanced search (faster than exhaustive)
};
```

---

## Key Algorithm Concepts

### 1. Interval Variables
Each task becomes an interval in CP-SAT:
```javascript
const interval = model.newIntervalVar({
  start: model.newIntVar(0, INT32_MAX, `task_${i}_start`),
  end: model.newIntVar(0, INT32_MAX, `task_${i}_end`),
  size: TASK_DURATION_SECONDS,  // fixed size
});
```

### 2. Worker Assignment  
Each task assigned to one of N builders (N from Builders_Hut/OTTO count):
```javascript
const workerVar = model.newIntVar(0, numWorkers - 1, `task_${i}_worker`);
```

### 3. Precedence Constraints
Dependencies between tasks (e.g., L1 → L2 of same building):
```javascript
model.add(task2.start >= task1.end);  // Linear constraint
```

### 4. Worker Capacity Constraint
Max N tasks running simultaneously (N from village configuration):
```javascript
model.addCumulative({
  intervals: allIntervalVars,
  demands: allOnes,  // Each task demands 1 worker
  capacity: numWorkersFromVillage  // Dynamic from builders/OTTO
});
```

### 5. Sleep Window Constraint
Jobs cannot START between 23:00-07:00:
```javascript
const hourOfDay = task.start.divideByConstant(3600).modulo(24);
model.add(hourOfDay >= 7);   // >= 07:00
model.add(hourOfDay <= 22);  // <= 22:59
```

### 6. Weighted Completion Time Objective
Minimize: Σ(weight_tier[i] × end_time[i])
- Gives priority to completing high-value tasks early
- Automatically triggers JIT TH: TH gets weight=50, so solver schedules TH to finish exactly when builders free up

### 7. Daily Resource Smoothing Objective
Minimize: Σ(max_daily_cost - avg_daily_cost) per resource type
- No farming rate parameter needed
- Solver naturally spaces expensive upgrades to balance daily costs
- Example: [Golem 100h → delay → Spell 50h] better than [Spell + Golem same day]

### 8. Builder Idle Time Objective  
Minimize: Σ(builder_free_hours) when pending work exists
- Reduces number of hours builders have nothing to do
- Combined weight with resource smoothing forces solver to balance both

---

## Implementation Checklist (Quick)

### Pre-Implementation
- [ ] Read PHASE_8B_CP_SAT_SCHEDULER_SPECIFICATION.md (sections 3-6)
- [ ] Understand interval variables and cumulative constraints
- [ ] Set up test case (5 tasks, simple dependencies)

### Task 1: OR-Tools Setup
- [ ] `npm install google-ortools`
- [ ] Create `src/solvers/cpsat-scheduler-base.js`
- [ ] Test import + instantiation
- [ ] Verify solver works on trivial problem

### Task 2: Variables
- [ ] Implement interval variable creation per task
- [ ] Implement worker assignment variable per task
- [ ] Create varMap: `taskIndex → (intervalVar, workerVar)`
- [ ] Test on 5-task example

### Task 3: Constraints
- [ ] Precedence: `start[i] >= end[predecessor]`
- [ ] Capacity: `model.addCumulative(intervals, demands=1, capacity=3)`
- [ ] Sleep window: `hourOfDay ∈ [7, 22]`
- [ ] Test each independently

### Task 4: Objectives
- [ ] Weighted completion: Σ(priority_weight[i] × end[i])
- [ ] Resource smoothing: Per-day cost variance per resource
- [ ] Idle time: Free builder-hours when work pending
- [ ] Combine with weights: 1.0×completion + 0.001×idle + 0.001×smoothing
- [ ] Test calculation on small case

### Task 5: Solution Extraction
- [ ] Query solution: `start[i]`, `end[i]`, `worker[i]`
- [ ] Reconstruct task objects
- [ ] Return schedule in greedy scheduler format
- [ ] Test format compatibility

### Task 6: Validation
- [ ] Check all hard constraints in extracted schedule
- [ ] Verify objective value matches solver
- [ ] Throw errors on mismatch
- [ ] Test on generated solution

### Task 7: Unit Tests
- [ ] 7+ test cases covering all features
- [ ] Regression test vs greedy scheduler
- [ ] All test passing

### Task 8: UI Integration
- [ ] Replace `myScheduler()` call with CP-SAT
- [ ] Update exports in solvers/index.js
- [ ] Existing tests still pass
- [ ] App.js transparent to users

### Task 9: Performance & Documentation
- [ ] Benchmark on TH6, TH10, TH14, TH15
- [ ] Solve time < 5 seconds
- [ ] JIT TH trigger verified
- [ ] Resource smoothing verified
- [ ] Documentation complete

---

## Common Pitfalls & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| "Model has no feasible solution" | Conflicting constraints or missing soft relaxation | Check precedence > total horizon; verify sleep window allows at least 1 valid window |
| Solver timeout | Too many variables or tight search time limit | Increase time limit to 60s; reduce problem size; enable search heuristics |
| JIT TH not triggered | Incomplete objective formulation | Verify TH has Tier 4 weight (50); verify idle-time penalty non-zero (0.001) |
| Daily costs still bunched | Resource smoothing weight too low | Increase resource penalty weight to 0.01 temporarily; check per-day aggregation logic |
| Sleep window violated in solution | Interval arithmetic off by 1 hour | Verify: `hourOfDay = (epochSeconds % 86400) / 3600` (no rounding); check zone (UTC or local?) |
| Wrong task order in output | Solution extraction mapping broken | Verify varMap keys match task indices; check task reconstruct preserves order |

---

## Testing Template (Quick Copy-Paste)

```javascript
// Test: Precedence constraint
test('CP-SAT respects task precedence', async () => {
  const tasks = [
    { id: 'L1_Barracks', duration: 3600, predecessors: [] },
    { id: 'L2_Barracks', duration: 7200, predecessors: ['L1_Barracks'] }
  ];
  
  const schedule = await solveWithCPSAT(tasks, 'balanced');
  
  const l1End = schedule.find(t => t.id === 'L1_Barracks').end;
  const l2Start = schedule.find(t => t.id === 'L2_Barracks').start;
  
  expect(l2Start).toBeGreaterThanOrEqual(l1End);
});

// Test: Worker capacity
test('CP-SAT enforces max N concurrent workers (N from village)', async () => {
  // Generate 10 independent tasks (no precedence)
  // Verify no time slice has > 3 overlapping tasks
});

// Test: Objective function
test('CP-SAT produces lower or equal makespan vs greedy', async () => {
  const tasks = /* realistic 10-task example */;
  const cpSatSchedule = await solveWithCPSAT(tasks, 'balanced');
  const greedySchedule = await solveWithGreedy(tasks, 'balanced');
  
  const cpMakespan = Math.max(...cpSatSchedule.map(t => t.end));
  const greedyMakespan = Math.max(...greedySchedule.map(t => t.end));
  
  expect(cpMakespan).toBeLessThanOrEqual(greedyMakespan);
});
```

---

## Git Commit Strategy

Suggested commits to keep Phase 8b traceable:

1. `feat(phase-8b): or-tools integration + cpsat-scheduler base`
2. `feat(phase-8b): cp variables and worker assignment`
3. `feat(phase-8b): precedence, capacity, sleep window constraints`
4. `feat(phase-8b): objective function (completion, smoothing, idle)`
5. `feat(phase-8b): solution extraction and validation`
6. `feat(phase-8b): unit tests and regression suite`
7. `feat(phase-8b): ui integration (cpsat becomes default scheduler)`
8. `feat(phase-8b): performance benchmarking and tuning`
9. `docs(phase-8b): completion documentation`

---

## Debug Checklist (If Things Break)

- [ ] Enable OR-Tools logging: `logSearchProgress: true`
- [ ] Print model statistics: `console.log(model.validate())`
- [ ] Print objective value: `console.log(objective.weightedExpression())`
- [ ] Verify task durations converted to epochs correctly
- [ ] Check sleep window math: `(epochSeconds % 86400) / 3600` in range [0, 24)
- [ ] Verify workerVar domain is [0, numWorkers-1] (matches village builder count)
- [ ] Check if any precedence creates circular dependency
- [ ] Review CP-SAT solution extractor loop - off-by-one errors common

---

## Next Phase (9) Preview

After Phase 8b is done:
- Multi-village optimization (3+ villages as 1 big scheduling problem)
- Per-village solver strategy selection (CP-SAT vs Greedy)
- Persistent village data model improvements
- Schedule versioning and comparison tools

---

