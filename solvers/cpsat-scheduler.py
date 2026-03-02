#!/usr/bin/env python3
"""
CP-SAT Scheduler (Phase 8b)
Google OR-Tools constraint programming solver for optimal building schedules

Uses constraint programming to minimize makespan (total build time) while
respecting builder count limits and other constraints.
"""

import sys
import json
import time
from ortools.sat.python import cp_model


def solve_schedule(village_data, config):
    """
    Solve village building schedule using Google OR-Tools CP-SAT

    Args:
        village_data: dict with:
            - buildings: list of {id, name, duration_s}
            - num_builders: int (max concurrent builders)
        config: solver configuration:
            - timeout_s: max solve time (default 10)
            - num_threads: parallel threads (default 4)
            - log_search_progress: verbose logging (default False)

    Returns:
        dict with:
            - success: bool (True if solved, False if error)
            - schedule: [{id, name, start, duration, end}, ...] or None
            - numBuilders: int
            - startTime: unix timestamp (0 for now)
            - makespan: int (seconds to complete all)
            - solveTimeMs: float
            - iterations: int (solver iterations)
            - err: bool
            - status: str (OPTIMAL, FEASIBLE, INFEASIBLE, etc.)
    """
    start_time = time.time()

    try:
        # Extract inputs
        buildings = village_data.get("buildings", [])
        num_builders = max(1, village_data.get("num_builders", 1))
        
        timeout_s = config.get("timeout_s", 10)
        num_threads = config.get("num_threads", 4)
        log_progress = config.get("log_search_progress", False)

        # Validate input
        if not buildings:
            return {
                "success": True,
                "schedule": [],
                "numBuilders": num_builders,
                "startTime": 0,
                "makespan": 0,
                "solveTimeMs": 0,
                "iterations": 0,
                "err": False,
                "status": "EMPTY (no buildings)",
            }

        # Create CP-SAT model
        model = cp_model.CpModel()

        # Horizon: max possible time (sum of all durations = upper bound)
        horizon = sum(int(b.get("duration_s", 0)) for b in buildings)
        
        # Decision variables: start time for each building
        # x[i] = start time of building i (in seconds)
        all_tasks = {}
        for i, building in enumerate(buildings):
            duration = int(building.get("duration_s", 0))
            if duration <= 0:
                duration = 1  # Minimum 1 second
            
            task_name = building.get("id", f"building_{i}")
            task_var = model.NewIntVar(0, horizon, f"start_{task_name}")
            all_tasks[i] = {
                "start": task_var,
                "duration": duration,
                "id": building.get("id"),
                "name": building.get("name", f"Building {i}"),
            }

        # Constraint 1: Non-overlapping intervals for builder capacity
        # Create interval variables for scheduling
        all_intervals = []
        for i, task in all_tasks.items():
            suffix = task["id"] if task["id"] else str(i)
            interval = model.NewIntervalVar(
                task["start"],
                task["duration"],
                model.NewIntVar(0, horizon, f"end_{suffix}"),
                f"interval_{suffix}",
            )
            all_intervals.append(interval)

        # Constraint 2: Cumulative constraint - max N builders at any time
        cumul_var = model.NewIntVar(0, num_builders, "num_concurrent")
        model.AddCumulative(all_intervals, [1] * len(all_intervals), num_builders)

        # Objective: Minimize makespan (completion time of last building)
        # makespan = max(start + duration for all buildings)
        makespan_var = model.NewIntVar(0, horizon, "makespan")
        
        # Add constraint: makespan >= start + duration for each building
        for i, task in all_tasks.items():
            model.Add(
                makespan_var >= task["start"] + task["duration"]
            )

        model.Minimize(makespan_var)

        # Configure solver
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = timeout_s
        solver.parameters.num_workers = num_threads
        solver.parameters.log_search_progress = log_progress

        # Solve
        status = solver.Solve(model)

        # Parse solution
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            # Build schedule from solution
            schedule_items = []
            makespan = 0

            for i, task in all_tasks.items():
                start = solver.Value(task["start"])
                duration = task["duration"]
                end = start + duration
                makespan = max(makespan, end)

                schedule_items.append({
                    "id": task["id"],
                    "name": task["name"],
                    "start": int(start),
                    "duration": int(duration),
                    "end": int(end),
                })

            # Sort by start time
            schedule_items.sort(key=lambda x: x["start"])

            solve_time_ms = (time.time() - start_time) * 1000
            
            # Get iteration count from statistics
            iterations = 0
            if hasattr(solver, 'statistics') and solver.statistics:
                iterations = getattr(solver.statistics, 'num_branches', 0) + getattr(solver.statistics, 'num_conflicts', 0)

            return {
                "success": True,
                "schedule": schedule_items,
                "numBuilders": num_builders,
                "startTime": 0,
                "makespan": int(makespan),
                "solveTimeMs": round(solve_time_ms, 2),
                "iterations": iterations,
                "err": False,
                "status": "OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE",
            }
        else:
            # No solution found - return error
            status_map = {
                cp_model.INFEASIBLE: "INFEASIBLE",
                cp_model.MODEL_INVALID: "INVALID",
                cp_model.UNKNOWN: "UNKNOWN"
            }
            status_str = status_map.get(status, f"UNKNOWN_STATUS_{status}")

            return {
                "success": False,
                "schedule": None,
                "numBuilders": num_builders,
                "startTime": 0,
                "makespan": 0,
                "solveTimeMs": round((time.time() - start_time) * 1000, 2),
                "iterations": 0,
                "err": True,
                "status": status_str,
            }

    except Exception as e:
        # Error during solving
        return {
            "success": False,
            "schedule": None,
            "numBuilders": num_builders,
            "startTime": 0,
            "makespan": 0,
            "solveTimeMs": round((time.time() - start_time) * 1000, 2),
            "iterations": 0,
            "err": True,
            "status": f"ERROR: {str(e)}",
        }


def main():
    """
    Main entry point
    Reads JSON from stdin, solves, writes JSON to stdout
    """
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        payload = json.loads(input_data)

        village_data = payload.get("village", {})
        config = payload.get("config", {})

        # Solve
        result = solve_schedule(village_data, config)

        # Write result to stdout
        json.dump(result, sys.stdout)
        sys.stdout.flush()

    except json.JSONDecodeError as e:
        error_response = {
            "success": False,
            "error": f"JSON parse error: {str(e)}",
        }
        json.dump(error_response, sys.stdout)
        sys.exit(1)
    except Exception as e:
        error_response = {
            "success": False,
            "error": f"Solver error: {str(e)}",
        }
        json.dump(error_response, sys.stdout)
        sys.exit(1)


if __name__ == "__main__":
    main()
