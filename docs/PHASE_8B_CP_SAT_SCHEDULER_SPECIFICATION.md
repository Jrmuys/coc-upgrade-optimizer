# Phase 8b: Constraint Programming Scheduler (CP-SAT)
## Complete Technical Specification

**Status**: Design Ready (Implementation Pending)  
**Date**: 2026-03-01  
**Scope**: Building-only scheduler (Laboratory deferred to Phase 9)

---

## 1. Executive Summary

The current scheduler uses a **greedy list-scheduling algorithm** that makes locally optimal task selections without considering global impact. This approach has fundamental limitations:

- **No backtracking**: Once a task is assigned, it cannot be reassigned
- **No lookahead**: Cannot anticipate future bottlenecks or idle builder windows
- **Suboptimal makespan**: Often fails to minimize total completion time
- **Resource bunching**: Tends to schedule expensive upgrades consecutively

**Phase 8b replaces this with a Constraint Programming (CP) solver** using Google OR-Tools CP-SAT. The solver formulates scheduling as a mathematical optimization problem, exploring millions of valid assignments to find provably optimal schedules.

**Key insight**: This enables the "Just-In-Time Town Hall Trigger" — the solver automatically schedules TH upgrade exactly when builders would run idle, transitioning seamlessly to the next TH level.

---

## 2. What Gets Solved

### In Scope (Phase 8b)
- ✅ Building, trap, and wall upgrades only
- ✅ Precedence: Level N → Level N+1
- ✅ Worker capacity: Variable worker count (from Builders Huts + B.O.B_Hut count, or OTTO for Builder Base)
- ✅ Sleep windows: Cannot START tasks between 23:00-07:00
- ✅ Resource smoothing: Automatically balance daily farming requirements
- ✅ Builder idle minimization: Avoid idle builders before TH downtime
- ✅ Multi-objective optimization: Balance completion time, resource spread, and idle time
- ✅ Hero upgrades: Constrained by Hero Hall level (precedence dependencies)

### Out of Scope (Phase 9+)
- ❌ Laboratory/research queue (separate single-worker solver)
- ❌ Multi-village coordination (Phase 9)
- ❌ Real-time rescheduling (Phase 11)

---

## 3. Mathematical Formulation

### 3.1 Decision Variables

For each task $i$ in the task set $T$:

$$\text{start}_i \in \mathbb{Z}_{\geq 0} \quad \text{(epoch seconds when task starts)}$$

$$\text{worker}_i \in \{0, 1, 2\} \quad \text{(which builder executes task)}$$

$$\text{end}_i = \text{start}_i + \text{duration}_i \quad \text{(implicit, derived)}$$

**Note**: End time is derived, not a decision variable. This reduces the solver's search space.

---

### 3.2 Problem Parameters

For each task $i$:
- $\text{duration}_i$: Time to complete (seconds)
- $\text{cost}[\text{resource}]_i$: Resource cost breakdown (gold, elixir, dark elixir)
- $\text{category}_i$: Building category (offense, defense, economy, etc.)
- $\text{pred}_i$: Set of predecessor task indices (must complete before $i$)
- $\text{weight}_i$: Priority tier weight (1 to 1000)

Global parameters:
- $B = 3$: Number of builders
- $T_{\text{sleep}}$: Sleep window, e.g., [82800, 25200] seconds (23:00 to 07:00)
- $W_{\text{time}}$: Weight for completion time objective
- $W_{\text{idle}}$: Weight for builder idle time objective
- $W_{\text{resource}}$: Weight for resource smoothing penalty

---

### 3.3 Hard Constraints

#### Constraint 1: Precedence (Task Dependencies)

For each task $i$ with predecessors $\text{pred}(i)$:

$$\text{start}_i \geq \max_{j \in \text{pred}(i)} (\text{end}_j)$$

**Interpretation**: A task cannot start until all its prerequisites complete.

**Example**: Cannon L10 must complete before Cannon L11 starts.

---

#### Constraint 2: Worker Capacity (Cumulative Constraint)

At any point in time $t$, at most $B=3$ tasks can be active:

$$\left| \{i : \text{start}_i \leq t < \text{end}_i\} \right| \leq B \quad \forall t$$

This is expressed as a CP "cumulative" constraint:
```
cumulative(
  start_times=[start_i for all i],
  durations=[duration_i for all i],
  demands=[1 for all i],  // each task needs 1 builder
  capacity=3               // at most 3 builders
)
```

**Interpretation**: Builders are a shared resource; only 3 tasks can run simultaneously.

---

#### Constraint 3: Sleep Window (No Start During Sleep)

For each task $i$, its start time must occur outside the sleep window.

Let $\text{hour}(t) = \lfloor (t \bmod 86400) / 3600 \rfloor$ be the hour of day (0-23).

$$\text{hour}(\text{start}_i) \notin [23, 6] \quad \forall i$$

Equivalently:
$$\text{hour}(\text{start}_i) \geq 7 \text{ AND } \text{hour}(\text{start}_i) \leq 22$$

**Interpretation**: You cannot start an upgrade while sleeping (23:00-07:00). The solver will naturally shift start times to comply.

**Note**: This is much simpler than the original greedy algorithm's active-time window enforcement. The solver doesn't "pause" time; it simply prevents task starts during sleep.

---

### 3.4 Soft Constraints (Penalties in Objective)

#### Penalty 1: Daily Resource Smoothness

For each resource type $r \in \{\text{gold}, \text{elixir}, \text{darkElixir}\}$:

1. Group tasks by start day: $\text{day}(t) = \lfloor t / 86400 \rfloor$
2. Calculate daily cost:
   $$C_r(d) = \sum_{i: \text{day}(\text{start}_i) = d} \text{cost}_i[r]$$
3. Compute spread metric:
   $$\text{ResourcePenalty}_r = \max_d C_r(d) - \text{avg}_d C_r(d)$$
4. Total penalty:
   $$\text{ResourcePenalty} = \sum_r \text{ResourcePenalty}_r$$

**Interpretation**: If gold costs vary wildly across days (e.g., 100M on day 1, 500K on day 2), the penalty is high. The solver minimizes this by spreading expensive tasks across different days.

**Why this works without a fixed farming rate**: The solver naturally learns to space expensive upgrades (X-Bow, Inferno, Scattershot) apart because bunching them increases the objective value. This mimics realistic farming behavior.

---

#### Penalty 2: Builder Idle Time

Define idle interval for builder $b$ as any time when:
- The builder has no task assigned, AND
- There exists a ready task (predecessors complete) that could run

$$\text{IdleTime} = \sum_{b=0}^{2} \sum_{\text{idle intervals}} \text{idle\_duration}$$

**Interpretation**: Penalizes leaving builders idle when work is available. This is the engine that triggers the JIT TH transition — when builders run out of parallel work, the solver reaches for the TH upgrade to keep them busy.

---

#### Penalty 3: Weighted Completion Time

For each task $i$, penalize delayed completion based on priority:

$$\text{WeightedCompletionTime} = \sum_i \text{weight}_i \cdot \text{end}_i$$

With priority tiers:
- **Tier 1** (weight 1000): Laboratory, Pet House, Blacksmith
- **Tier 2** (weight 500): Level 1 placements, walls
- **Tier 3** (weight 100): Army Camps, Clan Castle, Storages
- **Tier 4** (weight 50): Heavy defense (Eagle, Scattershot, Inferno)
- **Tier 5** (weight 10): Point defense (Cannon, Archer Tower, Wizard Tower)
- **Tier 6** (weight 1): Background grinds (Heroes, Traps, Collectors)

**Interpretation**: High-weight tasks should complete early. The solver is pushed toward realistic play: unlock offense/defense first, then grind heroes.

---

### 3.5 Objective Function

```
Minimize:
  W_time × WeightedCompletionTime
  + W_idle × IdleTime
  + W_resource × ResourcePenalty
```

**Default weights** (tuned empirically):
- $W_{\text{time}} = 1.0$
- $W_{\text{idle}} = 0.001$ (relatively low; makespan dominates)
- $W_{\text{resource}} = 0.001$ (soft constraint; prevents pathological solutions)

**Intuition**: 
- Primary goal: Minimize completion time, respecting priority tiers
- Secondary goal: Keep builders busy (activates JIT TH trigger)
- Tertiary goal: Smooth resource consumption (avoid feast/famine farming)

---

## 4. How It Solves Key Problems

### 4.1 The "Just-In-Time Town Hall Trigger"

**Problem**: When to schedule TH upgrade? Too early = waste builders; too late = miss next TH upgrades.

**Greedy solution**: No good solution. User must manually decide.

**CP-SAT solution**:

1. Scheduler includes TH upgrade as a task with no special status
2. TH has no predecessors (can start anytime)
3. TH has weight = 50 (Tier 4, after offense/defense unlocks)
4. As the solver optimizes:
   - Tier 1-3 tasks fill the builders early
   - Tier 4-5 tasks spread across available builders
   - Eventually, only Tier 6 (hero chains) remain
   - Solver realizes: 2 builders busy with hero upgrades, 1 would be idle
   - To minimize idle time (the `IdleTime` penalty), solver picks TH upgrade for the idle builder
   - TH finishes exactly when builders would have gone idle → Tier 1 tasks for next TH unlock immediately

**Result**: Automatic, provably optimal TH transition. No manual intervention.

---

### 4.2 Resource Smoothing Without Fixed Farming Rate

**Problem**: How to prevent "all expensive upgrades on Monday"?

**Greedy solution**: Heuristic rules, hard to tune.

**CP-SAT solution**:

The `ResourcePenalty` metric directly measures spread:
$$\text{Penalty} = (\text{max daily cost}) - (\text{avg daily cost})$$

The solver minimizes this. Result:
- If you have 10M gold and 10M elixir tasks, solver spreads them across days
- No hardcoded farming rate needed
- Automatically adapts to your village (fewer tasks = less spread required)

**Example**:
```
Schedule A (greedy):
  Day 1: 100M gold, 50K elixir
  Day 2: 500K gold, 100M elixir
  → Penalty = (100M - ~50M) + (100M - ~50M) = high

Schedule B (CP-SAT):
  Day 1: 50M gold, 50M elixir
  Day 2: 50M gold, 50M elixir
  → Penalty = 0 (perfect balance)

Solver picks Schedule B.
```

---

### 4.3 Builder Idle Awareness

**Problem**: Greedy algorithm doesn't look ahead; can't predict when builders will be free.

**CP-SAT solution**:

The `IdleTime` penalty directly measures free builder-hours. The solver minimizes this across the entire timeline, which forces it to:
- Pack parallel work when many tasks are ready
- Stagger long tasks strategically
- Reach for next-tier work when current tier is bottlenecked

This is fundamentally what distinguishes CP-SAT from greedy.

---

## 5. Implementation Architecture

### 5.1 Code Structure

```
src/
├── scheduler.js (refactored, legacy code removed)
├── solvers/
│   ├── cpsat-scheduler.js (NEW - main CP-SAT implementation)
│   ├── cpsat-formulator.js (NEW - convert tasks to CP model)
│   └── cpsat-validator.js (NEW - validate solution against constraints)
├── models/
│   ├── task-graph.js (NEW - build precedence DAG, already partially done)
│   └── priority-tiers.js (NEW - map buildings to tier weights)
└── tests/
    ├── cpsat-scheduler.test.js (NEW - test CP-SAT logic)
    └── scheduler.test.js (maintain compatibility tests)
```

### 5.2 Execution Flow

```
generateSchedule(jsonData, strategy='TimeMax', ...)
  ↓
buildTasks(jsonData) [unchanged from Phase 1]
  ↓
new CPSATScheduler(tasks, numWorkers=3, timestamp, activeWindows)
  ↓
createCPModel() [formulate as CP problem]
  ↓
solver.solve(model) [OR-Tools WASM]
  ↓
extractSchedule(solution) [convert CP solution to task list]
  ↓
return {schedule, makespan, iterations, ...}
```

### 5.3 OR-Tools Integration

Use **OR-Tools WASM** (browser-compatible):

```javascript
const ortools = require('google-ortools');  // npm package

const model = new ortools.CpModel();
const solver = new ortools.CpSolver();

// Add variables, constraints, objective
// ...

const status = solver.solve(model);
if (status === ortools.CpSolverStatus.OPTIMAL || 
    status === ortools.CpSolverStatus.FEASIBLE) {
  const solution = extractSchedule(solver);
}
```

---

## 6. Validation Strategy

### 6.1 Constraint Verification

Post-solve, validate all hard constraints:

```javascript
function validateSchedule(schedule, tasks) {
  // 1. Check precedence
  for (const task of schedule) {
    for (const predIdx of task.pred) {
      const predTask = schedule.find(t => t.index === predIdx);
      if (predTask.end > task.start) {
        throw new Error(`Precedence violation: ${predIdx} ends after ${task.index} starts`);
      }
    }
  }
  
  // 2. Check worker capacity (max 3 concurrent)
  const timeline = [];
  for (const task of schedule) {
    timeline.push({time: task.start, type: 'start', worker: task.worker});
    timeline.push({time: task.end, type: 'end', worker: task.worker});
  }
  timeline.sort((a, b) => a.time - b.time);
  let active = 0;
  for (const event of timeline) {
    if (event.type === 'start') active++;
    else active--;
    if (active > 3) throw new Error(`Worker capacity violated at ${event.time}`);
  }
  
  // 3. Check sleep window
  for (const task of schedule) {
    const hourOfDay = Math.floor((task.start % 86400) / 3600);
    if (hourOfDay >= 23 || hourOfDay < 7) {
      throw new Error(`Sleep window violated: task ${task.id} starts at ${hourOfDay}:00`);
    }
  }
}
```

### 6.2 Objective Verification

After extracting solution, calculate actual objective value:

```javascript
function evaluateObjective(schedule) {
  const W_time = 1.0;
  const W_idle = 0.001;
  const W_resource = 0.001;
  
  const weightedCompletion = schedule.reduce((sum, t) => 
    sum + PRIORITY_WEIGHTS[t.id] * t.end, 0);
  const idleTime = calculateIdleTime(schedule);
  const resourcePenalty = calculateResourcePenalty(schedule);
  
  return W_time * weightedCompletion + 
         W_idle * idleTime + 
         W_resource * resourcePenalty;
}
```

### 6.3 Regression Testing

Maintain existing tests comparing CP-SAT output to greedy on known cases:

```javascript
test('CP-SAT produces shorter or equal makespan vs greedy', () => {
  const greedyResult = greedyScheduler(testData, 'LPT');
  const cpResult = cpsatScheduler(testData, 'TimeMax');
  
  expect(parseDuration(cpResult.makespan)).toBeLessThanOrEqual(
    parseDuration(greedyResult.makespan)
  );
});
```

---

## 7. Configuration and Tuning

### 7.1 Objective Weights

Modifiable via config or API (future: UI):

```javascript
const OBJECTIVE_WEIGHTS = {
  completion_time: 1.0,    // Primary
  idle_time: 0.001,       // Secondary (activates JIT TH)
  resource_smoothness: 0.001  // Tertiary (prevents pathological solutions)
};
```

**Tuning strategy**:
- If schedules are too slow (makespan too high), increase `completion_time`
- If builders are idle before TH, increase `idle_time`
- If resources bunch, increase `resource_smoothness`

### 7.2 Priority Tier Weights

Configurable per profile (future):

```javascript
const TIER_WEIGHTS = {
  TIER_1_UNLOCKERS: 1000,           // Lab, Pet House, Blacksmith
  TIER_2_QUICK_WINS: 500,           // Level 1 placements, walls
  TIER_3_CORE: 100,                 // Camps, CC, Storage
  TIER_4_HEAVY_DEFENSE: 50,         // Eagle, Scattershot, Inferno
  TIER_5_POINT_DEFENSE: 10,         // Cannon, Archer Tower, Wizard
  TIER_6_GRINDS: 1                  // Heroes, Traps, Collectors
};
```

---

## 8. Limitations and Future Work

### Phase 8b Scope
- ✅ Buildings, traps, walls
- ✅ Hero upgrades (constrained by Hero Hall level)
- ❌ Laboratory (requires separate solver)
- ❌ Multi-village (Phase 9)
- ❌ Real-time adaptation (Phase 11)

### Known Limitations
1. **Sleep window is start-time only**: If a task is long enough to span sleep, it will end during sleep. Future: Add soft penalty if task overlaps sleep.
2. **No gap-filling logic**: If a task duration is 30 hours and sleep is 8 hours daily, the solver can't automatically "split" the work. Assumes task is atomic.
3. **No user overrides**: Once a schedule is computed, user can't manually adjust start times and reoptimize. Future: Add "pin" functionality.

---

## 9. Success Criteria

Phase 8b is complete when:

- [ ] CP-SAT solver installed and integrated
- [ ] All hard constraints enforced (precedence, worker capacity, sleep)
- [ ] All soft penalties implemented (resource smoothing, idle time, weighted completion)
- [ ] Validation tests pass (constraints verified post-solve)
- [ ] Regression tests pass (CP output ≥ greedy quality on test cases)
- [ ] JIT TH trigger verified on realistic test villages
- [ ] Resource smoothing verified on expensive-heavy villages (e.g., TH14-15)
- [ ] UI generates schedules via CP-SAT (no remaining greedy calls to generateSchedule)
- [ ] Performance acceptable (solve time < 5 seconds for typical village)
- [ ] Documentation complete (this spec + code comments)

---

## 10. Timeline Estimate

- **Subtask 1** (OR-Tools setup): 30 min
- **Subtask 2** (Convert tasks to CP): 2 hours
- **Subtask 3** (Hard constraints): 1.5 hours
- **Subtask 4** (Soft penalties): 2 hours
- **Subtask 5** (Solution extraction): 1 hour
- **Subtask 6** (Validation tests): 1.5 hours
- **Subtask 7** (UI integration): 1 hour
- **Subtask 8** (Performance + tuning): 1.5 hours

**Total estimate: 11-12 hours** (1.5 days focused work)

---

## 11. References

- Google OR-Tools: https://developers.google.com/optimization
- CP-SAT solver: https://developers.google.com/optimization/cp/cp_solver
- WASM (browser): https://github.com/google/or-tools/releases
- Scheduling theory: https://en.wikipedia.org/wiki/Scheduling_(computing)

