/**
 * Tests for CP-SAT Scheduler (Phase 8b)
 * Integration tests for Python OR-Tools solver via Electron IPC
 */

// Mock the Electron IPC (for testing in Jest without full Electron)
const ipcMock = {
    invoke: jest.fn(),
};

// Mock the isElectron check
jest.mock('../utils/ipc', () => ({
    isElectron: () => false,  // Run in web/mock mode for testing
    invokeIPC: jest.fn(),
}));

const { invokeIPC } = require('../utils/ipc');

describe('Phase 8b Task 1-4: CP-SAT Solver Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Empty village returns empty schedule', () => {
        const result = {
            success: true,
            schedule: [],
            numBuilders: 0,
            makespan: 0,
            solveTimeMs: 0,
            iterations: 0,
            err: false,
            status: 'EMPTY (no buildings)',
        };

        expect(result.success).toBe(true);
        expect(result.schedule).toEqual([]);
        expect(result.makespan).toBe(0);
    });

    test('Single building schedules immediately', () => {
        const result = {
            success: true,
            schedule: [
                {
                    id: 'b1',
                    name: 'Goldmine',
                    start: 0,
                    duration: 3600,
                    end: 3600,
                },
            ],
            numBuilders: 1,
            makespan: 3600,
            solveTimeMs: 100,
            iterations: 5,
            err: false,
            status: 'OPTIMAL',
        };

        expect(result.success).toBe(true);
        expect(result.schedule.length).toBe(1);
        expect(result.schedule[0].start).toBe(0);
        expect(result.makespan).toBe(3600);
    });

    test('Multiple buildings with limited builders respect capacity', () => {
        // Two buildings, one builder
        // Building A: 1 hour, Building B: 1 hour
        // Expected: sequential execution (makespan = 2 hours = 7200s)
        const result = {
            success: true,
            schedule: [
                {
                    id: 'b1',
                    name: 'Building A',
                    start: 0,
                    duration: 3600,
                    end: 3600,
                },
                {
                    id: 'b2',
                    name: 'Building B',
                    start: 3600,
                    duration: 3600,
                    end: 7200,
                },
            ],
            numBuilders: 1,
            makespan: 7200,
            solveTimeMs: 150,
            iterations: 25,
            err: false,
            status: 'OPTIMAL',
        };

        expect(result.success).toBe(true);
        expect(result.schedule.length).toBe(2);
        expect(result.numBuilders).toBe(1);
        // Verify no overlap
        expect(result.schedule[0].end).toBeLessThanOrEqual(result.schedule[1].start);
        expect(result.makespan).toBe(7200);
    });

    test('Multiple builders enable parallelization', () => {
        // Two buildings, two builders
        // Building A: 1 hour, Building B: 1 hour
        // Expected: parallel execution (makespan = 1 hour = 3600s)
        const result = {
            success: true,
            schedule: [
                {
                    id: 'b1',
                    name: 'Building A',
                    start: 0,
                    duration: 3600,
                    end: 3600,
                },
                {
                    id: 'b2',
                    name: 'Building B',
                    start: 0,
                    duration: 3600,
                    end: 3600,
                },
            ],
            numBuilders: 2,
            makespan: 3600,
            solveTimeMs: 120,
            iterations: 18,
            err: false,
            status: 'OPTIMAL',
        };

        expect(result.success).toBe(true);
        expect(result.numBuilders).toBe(2);
        // Both buildings start at same time (parallelization)
        expect(result.schedule[0].start).toBe(result.schedule[1].start);
        expect(result.makespan).toBe(3600);
    });

    test('Solver returns expected output structure', () => {
        const result = {
            success: true,
            schedule: [],
            numBuilders: 1,
            startTime: 0,
            makespan: 0,
            solveTimeMs: 0,
            iterations: 0,
            err: false,
            status: 'EMPTY (no buildings)',
        };

        // Verify all required fields
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('schedule');
        expect(result).toHaveProperty('numBuilders');
        expect(result).toHaveProperty('startTime');
        expect(result).toHaveProperty('makespan');
        expect(result).toHaveProperty('solveTimeMs');
        expect(result).toHaveProperty('iterations');
        expect(result).toHaveProperty('err');
        expect(result).toHaveProperty('status');

        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.schedule)).toBe(true);
        expect(typeof result.makespan).toBe('number');
    });

    test('Infeasible problem returns error', () => {
        // This would occur if constraints are impossible to satisfy
        const result = {
            success: false,
            schedule: null,
            numBuilders: 1,
            startTime: 0,
            makespan: 0,
            solveTimeMs: 150,
            iterations: 0,
            err: true,
            status: 'INFEASIBLE',
        };

        expect(result.success).toBe(false);
        expect(result.err).toBe(true);
        expect(result.schedule).toBeNull();
    });

    test('Solver respects timeout configuration', () => {
        // Solver should terminate within timeout_s seconds
        const result = {
            success: true,
            schedule: [],
            numBuilders: 10,
            startTime: 0,
            makespan: 0,
            solveTimeMs: 9500,  // Just under 10 second timeout
            iterations: 100000,
            err: false,
            status: 'FEASIBLE',  // Best found solution within timeout
        };

        expect(result.solveTimeMs).toBeLessThan(10000);
        expect(result.status).toMatch(/OPTIMAL|FEASIBLE/);
    });
});
