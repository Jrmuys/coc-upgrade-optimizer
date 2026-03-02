# Phase 8b: CP-SAT Solver Implementation Plan

**Duration Estimate**: 11-12 hours  
**Start Date**: March 2, 2026  
**Prerequisite**: Phase 8A (✅ Complete)  
**Blocking**: Phases 9+ (Multi-village optimization, AI recommendations)

## Overview

Phase 8b replaces the greedy scheduler (Phase 8a) with Google OR-Tools CP-SAT constraint programming solver. This delivers significantly better build schedules through optimization rather than heuristics.

## Why CP-SAT Instead of Greedy?

| Aspect | Greedy (Phase 8a) | CP-SAT (Phase 8b) |
|--------|-------------------|-------------------|
| Algorithm | LPT/SPT heuristic | Constraint Programming |
| Quality | Good (~80-90% optimal) | Near-optimal (95%+) |
| Time | Instant (<100ms) | Seconds (depends on size) |
| Customization | Limited | Highly flexible |
| Multi-objective | No | Yes (primary objective + constraints) |
| User experience | Fast feedback | Slightly slower, vastly better results |

**Decision**: CP-SAT for quality; fallback to greedy if timeout.

## Architecture

```
React App (App.js)
    ↓
useSolveSchedule() hook
    ↓
IPC: 'solve-schedule' channel
    ↓
Electron main process (electron.js)
    ↓
child_process.spawn('python', ['solvers/cpsat-scheduler.py'])
    ↓
CP-SAT Solver (cpsat-scheduler.py) ← Phase 8b implementation
    ├─ Input: { villageData, config }
    ├─ Parse: Buildings → Solver model
    ├─ Constraints: Clans, timezones, active time
    ├─ Objective: Minimize makespan (total time)
    └─ Output: { sch, numBuilders, startTime, err }
    ↓
stdout: JSON response
    ↓
Electron IPC handler parses & returns to React
    ↓
React updates schedule state, re-renders UI
```

## Core Tasks (11-12 hours)

### Task 1: OR-Tools Installation & Testing (1-2 hours)
**Goal**: Verify OR-Tools Python package works locally

**Steps**:
1. Install: `pip install ortools`
2. Verify: `python -c "from ortools.linear_solver import pywraplp"`
3. Test: Run trivial solver (minimize X where X ≥ 10)
4. Confirm: Tests in `/src/solvers/cpsat-scheduler.test.js` pass

**Deliverable**: OR-Tools environment ready, basic solver skeleton works

---

### Task 2: CP-SAT Model Design (2 hours)
**Goal**: Design constraints and objective function for village scheduling

**Design Decisions**:

**A. Decision Variables**
```python
# For each building B and time slot T:
x[B][T] = 1 if building B is scheduled to start at time T
         = 0 otherwise

# Makespan variable (objective to minimize):
makespan = max(finish_time of all buildings)
```

**B. Constraints**

1. **Logical Constraints**
   - Each building scheduled exactly once: Σ x[B][T] = 1 for all B
   - Start times must be valid (no negative, within active window)

2. **Clan Constraints** (if specified)
   - Buildings in same clan: no overlap of construction
   - Formula: finish(B1) ≤ start(B2) OR finish(B2) ≤ start(B1)

3. **Builder Constraints**
   - Max N builders available
   - If K buildings running simultaneously, need K builders
   - Formula: Σ(building_in_progress at time T) ≤ N for all T

4. **Timezone Constraints** (if applicable)
   - Active building times only during player's active window
   - E.g., 8am-11pm local time only

5. **Priority Constraints** (if specified)
   - Prioritized buildings finish before others (soft preference)
   - Can be weighted in objective function

**C. Objective Function**
```
Minimize: makespan
         (total time to complete all buildings)

Subject to:
- All constraints above
- Fallback: If solver timeout, return greedy solution
```

**D. Configuration Options**
```python
config = {
    'solver': 'CP-SAT',           # Algorithm choice
    'timeout_s': 10,               # Max solve time
    'num_threads': 4,              # Parallel threads
    'log_search_progress': False,  # Suppress verbosity
    'strategy': 'LPT',             # Initial heuristic (LPT/SPT)
    'builder_bonus_pct': 15,       # +15% builder capacity
}
```

**Deliverable**: Constraint model documented, test cases defined

---

### Task 3: Solver Implementation (5-6 hours)
**Goal**: Code the full CP-SAT solver in Python

**Implementation Plan**:

```python
# /solvers/cpsat-scheduler.py

from ortools.sat.python import cp_model
import json
import sys

def solve_village_schedule(village_data, config):
    """
    Solve village building schedule using Google OR-Tools CP-SAT
    
    Args:
        village_data: {
            buildings: [{id, name, duration_s, clan_id?, priority?}, ...],
            num_builders: int,
            config: {...}
        }
        config: {solver, timeout_s, num_threads, ...}
    
    Returns:
        {
            sch: {
                schedule: [{id, name, start, duration, end}, ...],
                makespan: total_seconds,
                iterations: solver_iterations
            },
            numBuilders: int,
            startTime: unix_timestamp,
            err: bool
        }
    """
    
    # 1. Input validation
    # 2. Create CP-SAT model
    model = cp_model.CpModel()
    
    # 3. Define decision variables
    # 4. Add constraints (logical, clan, builder, timezone)
    # 5. Set objective (minimize makespan)
    # 6. Configure solver
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = config.get('timeout_s', 10)
    
    # 7. Solve
    status = solver.Solve(model)
    
    # 8. Parse solution
    #    - If OPTIMAL: extract schedule
    #    - If FEASIBLE: use best found
    #    - If INFEASIBLE/UNKNOWN: fallback to greedy
    
    # 9. Format output
    # 10. Return JSON
```

**Key Milestones**:
- [ ] CP-SAT model creation (30 min)
- [ ] Decision variables & constraints (2 hours)
- [ ] Objective function (30 min)
- [ ] Solver configuration (30 min)
- [ ] Solution parsing (1 hour)
- [ ] Integration tests (1 hour)

**Deliverable**: Full Python solver, cpsat-scheduler.test.js tests pass

---

### Task 4: Integration Tests (1.5 hours)
**Goal**: Verify CP-SAT solver works end-to-end with React UI

**Tests**:

1. **Unit Tests** (`cpsat-scheduler.test.js`)
   - [ ] OR-Tools can be instantiated
   - [ ] Trivial problem solves (minimize X ≥ 10)
   - [ ] Single building schedules correctly
   - [ ] Multiple buildings pack optimally
   - [ ] Clan constraints respected
   - [ ] Builder limits respected
   - [ ] Timeout fallback works

2. **Integration Tests** (Electron)
   - [ ] React calls useSolveSchedule()
   - [ ] IPC 'solve-schedule' handler spawns Python
   - [ ] Python subprocess returns valid JSON
   - [ ] UI updates with new schedule

3. **Regression Tests**
   - [ ] All Phase 8a tests still pass
   - [ ] Greedy algorithm untouched (fallback only)
   - [ ] No breaking API changes

**Deliverable**: All integration tests passing, zero regressions

---

### Task 5: Comparison & Benchmarking (1 hour)
**Goal**: Compare CP-SAT vs greedy results

**Comparison Metrics**:
```
For 10+ test cases (varying sizes):
1. Solution quality:
   - Makespan (CP-SAT vs greedy)
   - Builder utilization
   - Schedule fragmentation
   
2. Solve time:
   - CP-SAT solve time (Python)
   - Greedy time (reference)
   - IPC overhead
   
3. User experience:
   - Perceived speed (loading state)
   - Improvement % over greedy
```

**Benchmark Suite**:
- Small: 5-10 buildings (instant)
- Medium: 20-30 buildings (1-2 seconds)
- Large: 50-100 buildings (5-10 seconds)
- XLarge: 100+ buildings (timeout fallback)

**Deliverable**: Benchmark report + performance profile

---

### Task 6: Documentation & Cleanup (1 hour)
**Goal**: Document CP-SAT design, update master plan

**Documentation**:
- [ ] CP-SAT algorithm overview
- [ ] Constraint descriptions
- [ ] Performance profile
- [ ] Known limitations
- [ ] Future optimizations (multi-objective, pareto front)

**Cleanup**:
- [ ] Remove debug logging
- [ ] Update comments
- [ ] Version bump (if applicable)
- [ ] Update README.md

**Deliverable**: Complete documentation, code ready for Phase 9

---

## Testing Strategy

### Unit Tests (cpsat-scheduler.test.js)
```javascript
describe('Phase 8b: CP-SAT Solver', () => {
    test('OR-Tools can be instantiated', () => { ... })
    test('Trivial problem solves', () => { ... })
    test('Single building schedules', () => { ... })
    test('Multiple buildings optimized', () => { ... })
    test('Clan constraints respected', () => { ... })
    test('Timeout gracefully falls back', () => { ... })
})
```

### Integration Tests (Electron manual)
```bash
npm run dev
# 1. Load village JSON
# 2. Click "Optimize Schedule"
# 3. Verify Python solver runs (check console logs)
# 4. Verify schedule updates in UI
# 5. Check performance metrics
```

### Regression Tests
```bash
npm test
# Expect all existing tests to pass
# CI should not break
```

## Success Criteria

- ✅ OR-Tools installed and verified
- ✅ CP-SAT solver fully implemented
- ✅ All 7+ unit tests passing
- ✅ Integration tests passing (IPC works)
- ✅ Regression tests passing (no breakage)
- ✅ Makespan improvement: ≥15% over greedy (typical)
- ✅ Solve time: <10 seconds for medium villages
- ✅ Documentation complete
- ✅ Code review ready

## Rollback Plan

If CP-SAT fails to integrate or causes regression:
1. Keep Python solver in `/solvers/branch-8b-cpsat.py`
2. Revert `/solvers/cpsat-scheduler.py` to stub
3. Greedy algorithm still works (Phase 8 compatible)
4. No impact to React app or Electron (IPC abstraction)
5. Zero downtime

## Phase 9 Implications

Phase 9 (Multi-village optimization) builds on Phase 8b:
- Will use CP-SAT solver instances in parallel
- Will add multi-objective constraints (gold/elixir priorities)
- Will implement Pareto frontier for tradeoff analysis

**Prerequisite**: ✅ Single-village CP-SAT fully tested and verified

## Timeline

| Task | Est. Time | Critical? |
|------|-----------|-----------|
| 1. Setup & verify | 1-2h | ✅ Yes (blocks 2-6) |
| 2. Model design | 2h | ✅ Yes (blocks 3) |
| 3. Solver impl | 5-6h | ✅ Yes (core work) |
| 4. Integration tests | 1.5h | ✅ Yes (validation) |
| 5. Benchmarking | 1h | No (informational) |
| 6. Documentation | 1h | No (cleanup) |
| **Total** | **11-12h** | |

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| OR-Tools Windows build issue | Use WSL2 if needed, or Docker |
| CP-SAT timeout too slow | Reduce solver timeout, tune parameters |
| Clan constraint complexity | Start with simpler constraints, add iteratively |
| IPC JSON serialization bug | Add logging to both sides |
| Regression in Phase 8a tests | Run full test suite before committing |

## Related Files

- `/solvers/cpsat-scheduler.py` (Phase 8b implementation here)
- `/src/solvers/cpsat-scheduler.test.js` (Tests)
- `/public/electron.js` (IPC handler - no changes needed)
- `/src/utils/ipc.js` (useSolveSchedule hook - may need small tweaks)
- Documentation: `/docs/ELECTRON_ARCHITECTURE.md` (update with CP-SAT details)

## References

- [Google OR-Tools Documentation](https://developers.google.com/optimization)
- [CP-SAT Python Guide](https://developers.google.com/optimization/cp/python)
- [CP-SAT Model Reference](https://developers.google.com/optimization/reference/python/sat)
- Phase 8a: [/docs/ELECTRON_ARCHITECTURE.md](docs/ELECTRON_ARCHITECTURE.md)
- Phase 8a: [/PHASE_8A_COMPLETION_REPORT.md](PHASE_8A_COMPLETION_REPORT.md)

---

**Next Phase**: Phase 8b execution (start Task 1)  
**Blocked By**: Nothing (Phase 8a complete)  
**Blocks**: Phase 9 (Multi-village optimization)  
