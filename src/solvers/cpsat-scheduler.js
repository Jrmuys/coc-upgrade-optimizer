/**
 * CP-SAT Scheduler (Phase 8b)
 * Google OR-Tools Constraint Programming solver for Clash of Clans upgrade scheduling
 *
 * Real solver: /solvers/cpsat-scheduler.py (Python with OR-Tools)
 * This JavaScript module provides:
 * - Type definitions for solver input/output
 * - Integration with useSolveSchedule() hook
 * - Fallback to greedy algorithm if Python solver unavailable
 *
 * Architecture:
 * React App → useSolveSchedule() hook → IPC 'solve-schedule'
 *          → Electron main process → Python subprocess
 *          → JSON response → React state update
 */

/**
 * Solve building schedule using CP-SAT solver
 * Called through IPC (spawn Python subprocess)
 *
 * @param {object} villageData - Village config with buildings and num_builders
 * @param {object} config - Solver config with timeout_s, num_threads, etc
 * @returns {Promise<object>} Solver result with schedule, makespan, etc
 */
async function solveScheduleViaPython(villageData, config = {}) {
    // This function is called through the Electron IPC handler
    // See: /public/electron.js (ipcMain.handle('solve-schedule'))
    // which spawns: python /solvers/cpsat-scheduler.py

    // For testing purposes, we return the expected structure
    // In production, Electron calls Python via subprocess
    return {
        success: true,
        schedule: [],
        numBuilders: villageData.num_builders || 1,
        startTime: 0,
        makespan: 0,
        solveTimeMs: 0,
        iterations: 0,
        err: false,
        status: 'STUB (actual solver runs in Python subprocess)',
    };
}

/**
 * Fallback greedy solver (if Python solver unavailable)
 * Uses Longest Processing Time heuristic
 *
 * @param {object} villageData - Village config
 * @returns {object} Greedy schedule
 */
function solveScheduleGreedy(villageData) {
    const buildings = villageData.buildings || [];
    const numBuilders = villageData.num_builders || 1;

    console.log('🟢 Greedy solver: received', buildings.length, 'buildings');
    if (buildings.length > 0) {
        const first = buildings[0];
        console.log('🟢 First building structure:', {
            keys: Object.keys(first),
            values: first,
        });
        console.log('🟢 First 3 buildings:', buildings.slice(0, 3));
    }

    if (!buildings.length) {
        return {
            success: true,
            schedule: [],
            numBuilders: numBuilders,
            makespan: 0,
            err: false,
            status: 'EMPTY',
        };
    }

    // Sort by duration (LPT - Longest Processing Time)
    const sorted = [...buildings].sort(
        (a, b) => (b.duration_s || 0) - (a.duration_s || 0),
    );

    // Greedy packing into builders
    const builderQueues = Array(numBuilders)
        .fill(0)
        .map(() => ({ endTime: 0, tasks: [] }));

    const scheduleItems = [];

    sorted.forEach((building, idx) => {
        const duration = building.duration_s || 0;

        // Find builder with earliest available time
        let minIdx = 0;
        let minTime = builderQueues[0].endTime;
        for (let i = 1; i < numBuilders; i++) {
            if (builderQueues[i].endTime < minTime) {
                minTime = builderQueues[i].endTime;
                minIdx = i;
            }
        }

        const startTime = builderQueues[minIdx].endTime;
        const endTime = startTime + duration;

        scheduleItems.push({
            id: building.id || `b${idx}`,
            name: building.name || `Building ${idx}`,
            level: building.level || building.lvl || 0, // Include level from building data
            start: startTime,
            duration: duration,
            end: endTime,
            worker: minIdx, // Track which builder this task is assigned to
            iter: 0, // Iteration counter for task tracking
        });

        builderQueues[minIdx].endTime = endTime;
        builderQueues[minIdx].tasks.push(building.id);
    });

    const makespan = Math.max(0, ...builderQueues.map((q) => q.endTime));

    // Sort by start time for output
    scheduleItems.sort((a, b) => a.start - b.start);

    console.log('🟢 Greedy result:', scheduleItems.length, 'tasks, makespan:', makespan);

    return {
        success: true,
        schedule: scheduleItems,
        numBuilders: numBuilders,
        makespan: makespan,
        err: false,
        status: 'GREEDY (LPT heuristic)',
    };
}

// Export
module.exports = {
    solveScheduleViaPython,
    solveScheduleGreedy,
};
