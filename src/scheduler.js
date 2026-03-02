import defenseConfig from './data/defenses.json' with { type: 'json' };
import trapConfig from './data/traps.json' with { type: 'json' };
import resConfig from './data/resources.json' with { type: 'json' };
import armyConfig from './data/army.json' with { type: 'json' };
import thConfig from './data/th.json' with { type: 'json' };
import bhConfig from './data/bh.json' with { type: 'json' };
import heroConfig from './data/heroes.json' with { type: 'json' };
import mapping from './data/mapping.json' with { type: 'json' };

import priority from './data/priority.json' with { type: 'json' };

// eslint-disable-next-line no-unused-vars
import playerData from './data/coc_data.json' with { type: 'json' };

// Debug logging toggle - set via environment or runtime flag
const DEBUG_SCHEDULER =
    process.env.REACT_APP_DEBUG_SCHEDULER === 'true' || false;

/**
 * Multi-Objective Optimization Profiles (Phase 8)
 * Each profile defines weights for competing optimization objectives
 */
const OBJECTIVE_PROFILES = {
    TimeMax: {
        name: 'Time Maximization (LPT)',
        description:
            'Pure speed - prioritize longest tasks first for fastest completion',
        weights: {
            duration: 1.0, // High weight on duration (LPT behavior)
            resource: 0.0, // Ignore resource smoothing
            heroAvail: 0.0, // Ignore hero availability
            categoryBalance: 0.0, // Ignore category balance
        },
    },
    Balanced: {
        name: 'Balanced',
        description: 'Balance speed, resources, and hero availability',
        weights: {
            duration: 0.4, // Moderate weight on duration
            resource: 0.3, // Consider resource smoothing
            heroAvail: 0.2, // Consider hero availability
            categoryBalance: 0.1, // Slight category balance
        },
    },
    HeroAvailability: {
        name: 'Hero Availability',
        description:
            'Keep heroes available for war by scheduling them strategically',
        weights: {
            duration: 0.2, // Low weight on duration
            resource: 0.1, // Low resource consideration
            heroAvail: 0.6, // High weight on hero availability
            categoryBalance: 0.1, // Slight category balance
        },
    },
    ResourceSmoothing: {
        name: 'Resource Smoothing',
        description: 'Minimize resource bottlenecks and idle builders',
        weights: {
            duration: 0.2, // Low weight on duration
            resource: 0.6, // High weight on resource smoothing
            heroAvail: 0.1, // Low hero consideration
            categoryBalance: 0.1, // Slight category balance
        },
    },
    RushMode: {
        name: 'Rush Mode',
        description: 'Focus on critical buildings for TH upgrade',
        weights: {
            duration: 0.3, // Moderate duration weight
            resource: 0.1, // Low resource consideration
            heroAvail: 0.0, // Ignore hero availability
            categoryBalance: 0.0, // Ignore category balance
            rushPriority: 0.6, // High weight on rush-critical buildings
        },
    },
};

/**
 * Calculate objective score for a task based on current profile
 * @param {Object} task - Task to score
 * @param {Object} profile - Active objective profile
 * @param {Object} context - Context for scoring (resources, heroes, etc.)
 * @returns {Number} - Composite objective score
 */
function calculateObjectiveScore(task, profile, context = {}) {
    const weights = profile.weights;
    let score = 0;

    // Duration component (normalized by max duration in ready queue)
    if (weights.duration > 0) {
        const maxDuration = context.maxDuration || 1;
        const durationScore = task.duration / maxDuration;
        score += weights.duration * durationScore;
    }

    // Resource smoothing component
    if (weights.resource > 0) {
        // Prefer tasks that use different resources than recently completed
        // Higher score if resource type is underutilized
        const resourceScore = calculateResourceScore(task, context);
        score += weights.resource * resourceScore;
    }

    // Hero availability component
    if (weights.heroAvail > 0) {
        // Lower score for heroes if they're needed soon (war time)
        const heroScore = calculateHeroAvailScore(task, context);
        score += weights.heroAvail * heroScore;
    }

    // Category balance component
    if (weights.categoryBalance > 0) {
        // Prefer categories that haven't been scheduled recently
        const categoryScore = calculateCategoryBalanceScore(task, context);
        score += weights.categoryBalance * categoryScore;
    }

    // Rush mode priority component
    if (weights.rushPriority > 0 && context.rushCriticalIds) {
        // Very high score for rush-critical buildings
        const rushScore = context.rushCriticalIds.has(task.id) ? 1.0 : 0.0;
        score += weights.rushPriority * rushScore;
    }

    // Store score on task for debugging/display
    task.objectiveScore = score;

    return score;
}

/**
 * Calculate resource smoothing score
 * Prefer tasks that balance resource usage
 */
function calculateResourceScore(task, context) {
    if (!context.recentResourceUsage) return 0.5; // Neutral if no context

    const taskResource = task.resource || 'mixed';
    const recentUsage = context.recentResourceUsage[taskResource] || 0;

    // Higher score for less-used resources (inverse of usage)
    const maxUsage = Math.max(...Object.values(context.recentResourceUsage), 1);
    return 1 - recentUsage / maxUsage;
}

/**
 * Calculate hero availability score
 * Lower score for heroes during war windows
 */
function calculateHeroAvailScore(task, context) {
    const heroIds = [
        'Barbarian_King',
        'Archer_Queen',
        'Grand_Warden',
        'Royal_Champion',
    ];
    const isHero = heroIds.includes(task.id);

    if (!isHero) return 0.5; // Neutral for non-heroes

    // If hero lock constraints configured, check if task would conflict
    if (context.heroLockWindows && context.heroLockWindows.length > 0) {
        const taskEnd = (context.currentTime || 0) + task.duration;
        const wouldConflict = context.heroLockWindows.some((window) => {
            return (
                taskEnd > window.start &&
                (context.currentTime || 0) < window.end
            );
        });

        // Low score if would conflict with war window
        return wouldConflict ? 0.0 : 1.0;
    }

    return 0.5; // Neutral if no constraints
}

/**
 * Calculate category balance score
 * Prefer categories not recently scheduled
 */
function calculateCategoryBalanceScore(task, context) {
    if (!context.recentCategoryCount) return 0.5; // Neutral if no context

    const category = task.category || 'other';
    const recentCount = context.recentCategoryCount[category] || 0;

    // Higher score for less-scheduled categories
    const maxCount = Math.max(...Object.values(context.recentCategoryCount), 1);
    return 1 - recentCount / maxCount;
}

function arrayToObject(arr) {
    return arr.reduce((acc, item) => {
        const key = Object.keys(item)[0];
        acc[key] = item[key];
        return acc;
    }, {});
}

function objToArray(task, qty = 1, char = 65) {
    const arr = Array.from({ length: qty }, (_, i) => {
        const mark = task.map((obj) => ({
            ...obj,
            iter: char,
        }));
        char++;
        return mark;
    }).flat();
    return { arr, char };
}

function applyBoost(durationSeconds, boost) {
    let reducedTime = durationSeconds * (1 - boost);

    const thirtyMinutes = 30 * 60;
    const oneDay = 24 * 60 * 60;

    let finalSeconds;

    if (durationSeconds < thirtyMinutes) {
        finalSeconds = Math.ceil(reducedTime);
    } else if (durationSeconds <= oneDay) {
        const tenMinutes = 10 * 60;
        finalSeconds = Math.floor(reducedTime / tenMinutes) * tenMinutes;
    } else {
        const oneHour = 60 * 60;
        finalSeconds = Math.floor(reducedTime / oneHour) * oneHour;
    }

    return finalSeconds;
}

function constructTasks(
    inputData,
    scheme = 'LPT',
    priori = false,
    base = 'home',
    builderBoost = 0,
) {
    let itemData = {
        ...defenseConfig,
        ...trapConfig,
        ...resConfig,
        ...armyConfig,
    };

    let pData = [],
        hData = [];
    const builderArmy = ['Builder_Army_Camp', 'Reinforcement_Camp'];
    const warnings = [];

    if (base === 'home') {
        // Home Village
        pData = [...inputData.buildings];
        if (inputData.traps) pData.push(...inputData.traps);
        hData = inputData.heroes;
    } else {
        // Builder Base
        pData = [...inputData.buildings2];
        if (inputData.traps2) pData.push(...inputData.traps2);
        hData = inputData.heroes2;
    }

    let buildData = [],
        buildings = [],
        heroes = [],
        heroData = [],
        tasks = [],
        unmappedCount = 0;
    for (let item of pData) {
        if (mapping[item.data] === undefined) {
            unmappedCount++;
            if (DEBUG_SCHEDULER) console.log('Missing mapping', item.data);
            continue;
        }
        if (!buildings.includes(mapping[item.data]))
            buildings.push(mapping[item.data]);

        buildData.push({ ...item, name: mapping[item.data] });
    }

    if (hData.length > 0) {
        for (let h of hData) {
            if (mapping[h.data] === undefined) continue;
            if (!heroes.includes(mapping[h.data])) heroes.push(mapping[h.data]);

            heroData.push({ ...h, name: mapping[h.data] });
        }
    }

    let currTH = 1,
        numWorkers = 2;
    if (base === 'home') {
        // Home Village
        currTH = buildData.find((b) => b.name === 'Town_Hall').lvl;
        numWorkers = buildData
            .filter((b) => b.name === 'Builders_Hut')
            .reduce((sum, v) => sum + (v.timer ? 1 : v.cnt || v.gear_up), 0);
        let BOB = buildData
            .filter((b) => b.name === 'B.O.B_Hut')
            ?.reduce((sum, v) => sum + (v.timer ? 1 : v.cnt || v.gear_up), 0);
        BOB = BOB ? BOB : 0;
        numWorkers += BOB;
        buildData = buildData.filter((b) => b.name !== 'Town_Hall');
    } else {
        // Builder Base
        currTH = buildData.find((b) => b.name === 'Builder_Hall').lvl;
        numWorkers = 1;
        const OTTO = buildData.find((b) => b.name === 'O.T.T.O_Outpost');
        numWorkers = OTTO ? numWorkers + 1 : numWorkers;
        buildData = buildData.filter((b) => b.name !== 'Builder_Hall');
    }

    const prevBuilds =
        base === 'home'
            ? arrayToObject(thConfig[currTH - 1])
            : arrayToObject(bhConfig[currTH - 1]);
    const maxBuilds =
        base === 'home'
            ? arrayToObject(thConfig[currTH])
            : arrayToObject(bhConfig[currTH]);
    const diff = Object.fromEntries(
        Object.keys(maxBuilds).map((k) => [
            k,
            (maxBuilds[k] || 0) - (prevBuilds[k] || 0),
        ]),
    );
    if (DEBUG_SCHEDULER) console.log('Building diff (new buildings):', diff);

    for (let b of buildings) {
        if (b === 'Wall') continue;
        if (!itemData[b]) continue;
        let currBuild = buildData.filter((i) => i.name === b);
        let currCount = 0,
            char = 1;
        if (currBuild.length !== 0) {
            currCount = currBuild.reduce(
                (sum, v) => sum + (v.timer ? 1 : v.cnt || v.gear_up || 1),
                0,
            );
        }

        // Missing Buildings
        if (currCount < maxBuilds[b]) {
            if (builderArmy.includes(b)) {
                let task = itemData[b]
                    .filter((item) => item.TH > 0 && item.TH <= currTH)
                    .sort((a, b) => b.level - a.level);
                task = task.splice(0, maxBuilds[b] - currCount).map((item) => ({
                    id: b,
                    level: item.level,
                    duration: applyBoost(item.duration, builderBoost),
                    priority: priority[b] && priori ? priority[b] : 100,
                    iter: char,
                }));
                tasks.push(...task);
            } else {
                let task = itemData[b]
                    .filter((item) => item.TH > 0 && item.TH <= currTH)
                    .map((item) => ({
                        id: b,
                        level: item.level,
                        duration: applyBoost(item.duration, builderBoost),
                        priority: priority[b] && priori ? priority[b] : 100,
                    })); // Immediate priority to build
                if (task.length > 1) {
                    // Splice first task only
                    let popTask = task.splice(0, 1)[0];
                    popTask.priority = 2;
                    popTask.iter = char;
                    tasks.push(popTask);
                }
                const resp = objToArray(task, maxBuilds[b] - currCount, char);
                char = resp.char;
                tasks.push(...resp.arr);
            }
        }

        // Existing Buildings
        for (let c of currBuild) {
            // Currently upgrading buildings - Priority 1
            if (c.timer) {
                let task = {
                    id: b,
                    level: c.lvl + 1,
                    duration: c.timer,
                    priority: 1,
                    iter: char,
                };
                tasks.push(task);
                c.lvl += 1;
            }
            if (builderArmy.includes(b)) continue;

            let currTask = itemData[b]
                ?.filter((item) => item.TH <= currTH)
                ?.sort((a, b) => b.level - a.level)
                .map((item) => ({
                    id: b,
                    level: item.level,
                    duration: applyBoost(item.duration, builderBoost),
                }))[0];
            let missingLvls = currTask?.level - c.lvl || 0;
            if (missingLvls > 0) {
                let missingTask = itemData[b].filter(
                    (item) =>
                        item.level > c.lvl &&
                        item.level <= currTask.level &&
                        item.TH <= currTH,
                );
                missingTask = missingTask.map((item) => ({
                    id: b,
                    level: item.level,
                    duration: applyBoost(item.duration, builderBoost),
                    priority: priority[b] && priori ? priority[b] : 100,
                }));
                const resp1 = objToArray(
                    missingTask,
                    c.timer ? 1 : c.cnt || c.gear_up || 1,
                    char,
                );
                char = resp1.char;
                tasks.push(...resp1.arr);
            } else {
                char++;
            }
        }
    }

    // Add new buildings
    for (const [d, val] of Object.entries(diff)) {
        if (
            !buildings.includes(d) &&
            (prevBuilds[d] ? prevBuilds[d] === 0 : true) &&
            maxBuilds[d] > 0
        ) {
            if (DEBUG_SCHEDULER)
                console.log('Adding new building:', d, 'count:', val);
            let newTask =
                itemData[d]
                    ?.filter((item) => item.TH <= currTH)
                    ?.map((item) => ({
                        id: d,
                        level: item.level,
                        duration: applyBoost(item.duration, builderBoost),
                        priority: priority[d] && priori ? priority[d] : 100,
                    })) || [];
            if (DEBUG_SCHEDULER) console.log('New building tasks:', newTask);
            if (newTask.length > 1) {
                // Splice first task only
                let popTask = newTask.splice(0, 1)[0];
                popTask.priority = 2;
                const resp1 = objToArray([popTask], val, 1);
                tasks.push(...resp1.arr);
            }
            const resp = objToArray(newTask, val, 1);
            tasks.push(...resp.arr);
        }
    }

    if (base === 'home') {
        for (let h of heroes) {
            const maxHeroHall =
                itemData['Hero_Hall']
                    .filter((i) => i.TH <= currTH)
                    ?.sort((a, b) => b.level - a.level)
                    .map((item) => ({
                        id: 'Hero_Hall',
                        level: item.level,
                        duration: applyBoost(item.duration, builderBoost),
                    }))[0] || 0;
            let currHero = heroData.find((he) => he.name === h);

            if (currHero.timer) {
                currHero.lvl += 1;
                tasks.push({
                    id: h,
                    level: currHero.lvl,
                    duration: currHero.timer,
                    priority: 1,
                    iter: 1,
                });
            }
            let missingHLvls = heroConfig[h].filter(
                (i) => i.HH <= maxHeroHall.level && i.level > currHero.lvl,
            );
            missingHLvls = missingHLvls.map((he) => ({
                id: h,
                level: he.level,
                duration: applyBoost(he.duration, builderBoost),
                HH: he.HH,
                priority: priority[h] && priori ? priority[h] : 100,
                iter: 1,
            }));

            tasks.push(...missingHLvls);
        }
    }

    if (unmappedCount > 0) {
        warnings.push(
            `Warning: ${unmappedCount} building/trap(s) had unknown mappings and were skipped`,
        );
    }

    tasks = lockPredecessors(inputData, tasks, warnings);
    const timestamp = inputData.timestamp || Math.floor(Date.now() / 1000);

    return { tasks, numWorkers, timestamp, warnings };
}

function sortTasks(arr, scheme, context = {}) {
    // Handle legacy LPT/SPT schemes
    if (scheme === 'LPT' || scheme === 'SPT') {
        const legacy =
            scheme === 'LPT'
                ? arr.sort(
                      (a, b) =>
                          a.priority - b.priority || b.duration - a.duration,
                  )
                : arr.sort(
                      (a, b) =>
                          a.priority - b.priority || a.duration - b.duration,
                  );
        return legacy;
    }

    // Handle objective-based profiles (Phase 8)
    const profile = OBJECTIVE_PROFILES[scheme];
    if (!profile) {
        console.error(`Unknown scheduling scheme: ${scheme}`);
        // Fall back to LPT
        return arr.sort(
            (a, b) => a.priority - b.priority || b.duration - a.duration,
        );
    }

    // Calculate max duration for normalization
    const maxDuration = Math.max(...arr.map((t) => t.duration), 1);
    const scoringContext = {
        ...context,
        maxDuration,
    };

    // Calculate objective scores for all tasks
    arr.forEach((task) =>
        calculateObjectiveScore(task, profile, scoringContext),
    );

    // Sort by priority first (preserve priority 1 = ongoing), then by objective score (descending)
    arr.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return (b.objectiveScore || 0) - (a.objectiveScore || 0);
    });

    return arr;
}

function lockPredecessors(playerData, tasks, warnings = []) {
    const heroes = [
        'Barbarian_King',
        'Archer_Queen',
        'Minion_Prince',
        'Grand_Warden',
        'Royal_Champion',
    ];

    // Add indices and canonical keys to all tasks
    tasks = tasks.map((t, idx) => ({
        ...t,
        index: idx,
        worker: null,
        pred: [],
        key: generateTaskKey(t.id, t.iter, t.level),
    }));

    const taskByKey = new Map(tasks.map((t) => [t.key, t]));

    // Lock to predecessor - Buildings (same building, previous level)
    for (const t of tasks) {
        const predKey = generateTaskKey(t.id, t.iter, t.level - 1);
        const pred = taskByKey.get(predKey);
        if (pred) t.pred.push(pred.index);
    }

    const heroTasks = tasks.filter((t) => heroes.includes(t.id));
    const heroHall = playerData.buildings.find((b) => b.data === 1000071); // Existing HH
    const hhTaskByLevel = new Map(
        tasks.filter((t) => t.id === 'Hero_Hall').map((t) => [t.level, t]),
    ); // To construct HH
    // Lock to predecessor - Heroes
    if (heroTasks.length > 0) {
        let hhLvl = 0;
        if (heroHall) {
            hhLvl = heroHall.lvl;
        }
        for (const hero of heroTasks) {
            if (hero.priority === 1) continue; // Skip ongoing upgrades
            if (hero.HH > hhLvl) {
                const reqTask = hhTaskByLevel.get(hero.HH);
                if (!reqTask) {
                    // Hero Hall not in schedule - recoverable with warning
                    warnings.push(
                        `Warning: Hero ${hero.id} level ${hero.level} requires Hero Hall level ${hero.HH}, but Hero Hall upgrade not in schedule. Task may start prematurely.`,
                    );
                    continue; // Don't add predecessor, let task be scheduled anyway
                }
                tasks[hero.index].pred.push(reqTask.index);
            }
        }
    }

    // Validate predecessor graph for cycles and issues
    validatePredecessorGraph(tasks, warnings);

    return tasks;
}

/**
 * Detects cycles in predecessor graph using DFS
 * Non-fatal: issues warning but doesn't throw
 * Cycles would cause infinite loop in scheduler
 */
function validatePredecessorGraph(tasks, warnings = []) {
    const visited = new Set();
    const recursionStack = new Set();

    function hasCycleDFS(taskIdx) {
        visited.add(taskIdx);
        recursionStack.add(taskIdx);

        const task = tasks[taskIdx];
        for (const predIdx of task.pred) {
            if (!visited.has(predIdx)) {
                if (hasCycleDFS(predIdx)) return true;
            } else if (recursionStack.has(predIdx)) {
                // Cycle found
                const cycleStart = tasks[predIdx];
                const cycleCurrent = task;
                warnings.push(
                    `Error: Cycle detected in predecessor graph: ${cycleCurrent.key} -> ${cycleStart.key}. This will cause infinite loop.`,
                );
                return true;
            }
        }

        recursionStack.delete(taskIdx);
        return false;
    }

    let hasCycle = false;
    for (let i = 0; i < tasks.length; i++) {
        if (!visited.has(i)) {
            if (hasCycleDFS(i)) {
                hasCycle = true;
                break;
            }
        }
    }

    if (hasCycle) {
        warnings.push(
            `Critical: Predecessor graph has cycles. Schedule will fail.`,
        );
    }

    // Validate all predecessor indices are valid
    for (const task of tasks) {
        for (const predIdx of task.pred) {
            if (predIdx < 0 || predIdx >= tasks.length) {
                warnings.push(
                    `Error: Task ${task.key} has invalid predecessor index ${predIdx}. Valid range: 0-${tasks.length - 1}`,
                );
            }
        }
    }

    if (DEBUG_SCHEDULER) {
        console.log(
            `Predecessor graph validation: ${tasks.length} tasks, cycles=${hasCycle}`,
        );
    }
}

function getTimeString(epoch) {
    const date = new Date(epoch * 1000); // convert to ms

    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    const timeString = `${hh}:${mm}`;
    return timeString;
}

function setDateString(epoch, target) {
    const targetSplit = target.split(':');
    const date = new Date(epoch * 1000);
    const targetDate = new Date(date);

    targetDate.setHours(targetSplit[0], targetSplit[1], 0, 0);

    if (targetDate.getTime() <= date.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    return Math.floor(targetDate.getTime() / 1000);
}

function myScheduler(
    tasks,
    numWorkers = 3,
    timestamp,
    scheme = 'LPT',
    activeStart = '08:00',
    activeEnd = '23:59',
    optimize = false,
) {
    // console.log(tasks.filter(t => heroes.includes(t.id)));
    // console.log(hhTask);
    // return;
    const taskLength = tasks.length;
    let iterations = 0;

    if (DEBUG_SCHEDULER) {
        console.log('=== Scheduler Start ===');
        console.log(
            'Tasks:',
            taskLength,
            'Workers:',
            numWorkers,
            'Scheme:',
            scheme,
        );
    }

    let ready = tasks.filter((t) => t.pred.length === 0);
    const taskByIndex = new Map(tasks.map((t) => [t.index, t]));
    const completedByKey = new Map();
    const notReadySet = new Set(
        tasks.filter((t) => t.pred.length !== 0).map((t) => t.index),
    );
    const remainingPredCount = new Map(
        tasks.map((t) => [t.index, t.pred.length]),
    );
    const successors = new Map(tasks.map((t) => [t.index, []]));
    for (const t of tasks) {
        for (const predIdx of t.pred) {
            const list = successors.get(predIdx);
            if (list) list.push(t.index);
        }
    }
    let running = [],
        completed = [];

    let workers = Array.from({ length: numWorkers }, () => null); // null means idle

    let currTime = timestamp;
    const startTime = currTime;

    // Initialize objective scoring context (Phase 8)
    const scoringContext = {
        currentTime: currTime,
        recentResourceUsage: { gold: 0, elixir: 0, darkElixir: 0, mixed: 0 },
        recentCategoryCount: {},
        heroLockWindows: [], // TODO: Load from user settings in future phase
        rushCriticalIds: new Set(), // TODO: Populate from rush mode config
    };

    ready = sortTasks(ready, scheme, scoringContext);

    while (
        ready.length > 0 ||
        completed.length !== taskLength ||
        notReadySet.size > 0
    ) {
        const MAX_ITERATIONS = 100000;
        if (iterations > MAX_ITERATIONS) {
            const diagnostics = {
                iterations,
                totalTasks: taskLength,
                completedTasks: completed.length,
                readyTasks: ready.length,
                notReadyTasks: notReadySet.size,
                runningTasks: running.length,
                workers: workers.map((w) => (w ? w.key : 'idle')),
            };
            if (DEBUG_SCHEDULER) {
                console.error('Loop overflow diagnostics:', diagnostics);
            }
            throw new Error(
                `Scheduler loop exceeded ${MAX_ITERATIONS} iterations. ` +
                    `Completed: ${completed.length}/${taskLength}, ` +
                    `Ready: ${ready.length}, NotReady: ${notReadySet.size}. ` +
                    `Likely cause: predecessor graph cycle or invalid time window.`,
            );
        }
        if (DEBUG_SCHEDULER && iterations % 1000 === 0) {
            console.log(
                `[Iteration ${iterations}] Total: ${taskLength}, Ready: ${ready.length}, NotReady: ${notReadySet.size}, Running: ${running.length}, Completed: ${completed.length}`,
            );
        }
        let idx = 0;
        const runningTasks = ready.filter(
            (t) => t.priority === 1 && t.pred.length === 0,
        );
        let freeWorkers = workers
            .map((w, idx) => ({ index: idx, value: w }))
            .filter((w) => w.value === null);

        while (freeWorkers.length > 0 && ready.length > 0) {
            let w = freeWorkers[0].index;

            // Prioritize running tasks (priority 1)
            if (runningTasks.length > 0) {
                const arrIdx = ready.findIndex(
                    (t) => t.key === runningTasks[0].key,
                );
                ready[arrIdx].worker = w;
                ready[arrIdx].start = currTime;
                ready[arrIdx].end = currTime + ready[arrIdx].duration;
                workers[w] = ready[arrIdx];
                running.push(ready[arrIdx]);
                runningTasks.shift();
                ready.splice(arrIdx, 1);

                const remIdx = freeWorkers.findIndex((fw) => fw.index === w);
                freeWorkers.splice(remIdx, 1);
                continue;
            }

            const currTimeString = getTimeString(currTime);
            // Break out if current timestamp is during off-time
            if (currTimeString < activeStart || currTimeString > activeEnd)
                break;

            const currTask = ready[idx];
            // Try to use same worker as previous level if available (deterministic affinity)
            const predKey = generateTaskKey(
                currTask.id,
                currTask.iter,
                currTask.level - 1,
            );
            const predTask = completedByKey.get(predKey);
            if (predTask && workers[predTask.worker] === null)
                w = predTask.worker;
            ready[idx].worker = w;
            ready[idx].start = currTime;
            ready[idx].end = currTime + ready[idx].duration;
            workers[w] = ready[idx];
            running.push(ready[idx]);
            ready.splice(idx, 1);

            const remIdx = freeWorkers.findIndex((fw) => fw.index === w);
            freeWorkers.splice(remIdx, 1);
        }

        let finishedTime = currTime;
        if (running.length > 0) {
            finishedTime = Math.min(...running.map((wd) => wd.end));
        }
        let finishTimeString = getTimeString(finishedTime);
        if (finishTimeString < activeStart || finishTimeString > activeEnd)
            finishedTime = setDateString(finishedTime, activeStart);
        currTime = finishedTime;
        const finishedTask = workers.filter((wd) => wd?.end <= finishedTime);
        for (let ft of finishedTask) {
            completed.push(ft);
            completedByKey.set(ft.key, ft);
            workers[ft.worker] = null;
            running = running.filter((t) => t.index !== ft.index);

            // Update objective scoring context (Phase 8)
            if (ft.resource) {
                scoringContext.recentResourceUsage[ft.resource] =
                    (scoringContext.recentResourceUsage[ft.resource] || 0) + 1;
            }
            if (ft.category) {
                scoringContext.recentCategoryCount[ft.category] =
                    (scoringContext.recentCategoryCount[ft.category] || 0) + 1;
            }
            scoringContext.currentTime = currTime;

            // Release successor tasks
            const succTask = successors.get(ft.index) || [];
            if (succTask.length > 0) {
                for (const succIdx of succTask) {
                    if (!notReadySet.has(succIdx)) continue;
                    const nextPredCount =
                        (remainingPredCount.get(succIdx) || 0) - 1;
                    remainingPredCount.set(succIdx, nextPredCount);
                    if (nextPredCount <= 0) {
                        const succ = taskByIndex.get(succIdx);
                        if (succ) ready.push(succ);
                        notReadySet.delete(succIdx);
                    }
                }
            }
        }
        ready = sortTasks(ready, scheme, scoringContext);
        iterations++;
    }

    if (running.length > 0) {
        completed.push(...running);
        running = [];
    }

    completed.sort((a, b) => a.start - b.start || a.worker - b.worker);
    let makespan = completed.reduce((m, r) => Math.max(m, r.end), 0);
    makespan = formatDuration(makespan - startTime);

    if (DEBUG_SCHEDULER) {
        console.log('=== Scheduler Complete ===');
        console.log('Total iterations:', iterations);
        console.log('Makespan:', makespan);
    }

    return { schedule: completed, makespan, iterations };
}

function formatDuration(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= 24 * 60 * 60;

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.length > 0 ? parts.join(' ') : '0s';
}

function printSchedule(schedule, printbyWorker = false) {
    if (!Array.isArray(schedule) || schedule.length === 0) {
        console.log('No tasks scheduled.');
        return;
    }

    console.log('=== Task Schedule ===');
    console.log(
        'Worker |  Task ID      | Level | Iter | Duration | Start | End',
    );
    console.log(
        '------- | ------------- | ----- | ---- | -------- | ----- | ---',
    );

    if (printbyWorker) {
        schedule = schedule.sort(
            (a, b) => a.worker - b.worker || a.start - b.start,
        );
    }

    for (const t of schedule) {
        console.log(
            `${t.worker.toString().padEnd(6)} | ${t.id.padEnd(12)} | ${t.level
                .toString()
                .padEnd(
                    5,
                )} | ${t.iter} | ${t.duration_iso.padEnd(8)} | ${t.start_iso.padEnd(7)} | ${t.end_iso}`,
        );
    }
}

function toISOString(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    let iso = 'P';
    if (d > 0) iso += d + 'D';

    if (h > 0 || m > 0 || s > 0) {
        iso += 'T';
        if (h > 0) iso += h + 'H';
        if (m > 0) iso += m + 'M';
        if (s > 0 || iso === 'P') iso += s + 'S';
    }

    return iso;
}

/**
 * Validates active-time start/end strings for correctness
 * @param {string} startTime - HH:MM format (e.g., "07:00")
 * @param {string} endTime - HH:MM format (e.g., "23:00")
 * @throws {Error} if invalid format
 */
function validateActiveTimeWindow(startTime, endTime) {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        throw new Error(
            `Invalid time format. Expected HH:MM. Got startTime=${startTime}, endTime=${endTime}`,
        );
    }
    const [sHour, sMin] = startTime.split(':').map(Number);
    const [eHour, eMin] = endTime.split(':').map(Number);

    if (sHour < 0 || sHour > 23 || sMin < 0 || sMin > 59) {
        throw new Error(`Invalid startTime: ${startTime}`);
    }
    if (eHour < 0 || eHour > 23 || eMin < 0 || eMin > 59) {
        throw new Error(`Invalid endTime: ${endTime}`);
    }
}

/**
 * Validates constructed tasks for common issues
 * Returns array of validation warnings (non-fatal issues)
 * Throws only for critical issues that prevent scheduling
 */
function validateTasks(tasks, warnings = []) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
        throw new Error('No tasks generated');
    }

    const seenKeys = new Set();
    let priorityCount = 0;

    for (const t of tasks) {
        // Check for required fields
        if (!t.id || t.level === undefined || t.duration === undefined) {
            throw new Error(
                `Task missing required fields: id=${t.id}, level=${t.level}, duration=${t.duration}`,
            );
        }

        // Check for duplicate keys
        if (seenKeys.has(t.key)) {
            throw new Error(
                `Duplicate task key: ${t.key}. Task keys must be unique.`,
            );
        }
        seenKeys.add(t.key);

        // Track priority 1 tasks (ongoing upgrades)
        if (t.priority === 1) {
            priorityCount++;
            if (!t.iter) {
                warnings.push(
                    `Warning: Priority 1 task ${t.key} missing iter assignment`,
                );
            }
        }

        // Validate duration is positive
        if (t.duration <= 0) {
            throw new Error(
                `Task ${t.key} has invalid duration: ${t.duration}`,
            );
        }

        // Validate priority is in expected range
        if (t.priority < 1 || t.priority > 100) {
            warnings.push(
                `Warning: Task ${t.key} has unusual priority ${t.priority}`,
            );
        }
    }

    if (priorityCount > 10) {
        warnings.push(
            `Warning: ${priorityCount} tasks marked priority 1 (ongoing). Expected < 10.`,
        );
    }

    if (DEBUG_SCHEDULER) {
        console.log(
            `Task validation: ${tasks.length} tasks, ${seenKeys.size} unique keys`,
        );
        if (warnings.length > 0) {
            console.log('Validation warnings:', warnings);
        }
    }

    return warnings;
}

/**
 * Canonical task key generator - used consistently across scheduler
 * @param {string} id - Building/hero ID
 * @param {number} iter - Iteration/instance character (1-26 or char code)
 * @param {number} level - Building/hero level
 * @returns {string} Unique stable key like "Town_Hall_A_12"
 */
function generateTaskKey(id, iter, level) {
    if (!id || iter === undefined || level === undefined) {
        throw new Error(
            `Invalid task key inputs: id=${id}, iter=${iter}, level=${level}`,
        );
    }
    return `${id}_${iter}_${level}`;
}

/**
 * Generates a determinism snapshot hash of a schedule
 * Used for regression testing - same inputs should produce same hash
 * @param {Array} schedule - Completed task schedule
 * @returns {string} Hash of schedule order and timing
 */
function hashScheduleSnapshot(schedule) {
    if (!Array.isArray(schedule) || schedule.length === 0) return 'EMPTY';

    // Create a canonical snapshot of critical schedule properties
    // Exclude timestamps/epochs to focus on task ordering
    const snapshot = schedule.map((t) => ({
        key: t.key,
        worker: t.worker,
        duration: t.duration,
        priority: t.priority,
    }));

    // Simple deterministic hash (not cryptographic, just for verification)
    let hash = 0;
    const jsonStr = JSON.stringify(snapshot);
    for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * Generates a baseline fixture snapshot for regression testing
 * Call this to capture expected behavior for a given input
 */
export function generateTestFixture(
    dataJSON,
    scheme = 'LPT',
    priorityMode = false,
    base = 'home',
    boost = 0.05,
) {
    const result = generateSchedule(
        dataJSON,
        false,
        scheme,
        priorityMode,
        base,
        boost,
    );

    if (result.err[0]) {
        console.error('Fixture generation failed:', result.err);
        return null;
    }

    return {
        timestamp: new Date().toISOString(),
        scheme,
        priorityMode,
        base,
        boost,
        makespan: result.sch.makespan,
        taskCount: result.sch.schedule.length,
        snapshot: hashScheduleSnapshot(result.sch.schedule),
        // Full schedule data for detailed comparison if needed
        schedule: result.sch.schedule.map((t) => ({
            key: t.key,
            worker: t.worker,
            duration: t.duration,
            priority: t.priority,
        })),
    };
}

/**
 * Validates a schedule against baseline fixture
 * Returns {match: boolean, differences: string[]}
 */
export function validateAgainstFixture(
    fixture,
    dataJSON,
    scheme,
    priorityMode,
    base,
    boost,
) {
    if (!fixture) {
        return { match: false, reason: 'No fixture provided' };
    }

    const result = generateSchedule(
        dataJSON,
        false,
        scheme,
        priorityMode,
        base,
        boost,
    );

    if (result.err[0]) {
        return {
            match: false,
            reason: `Schedule generation failed: ${result.err[1]}`,
        };
    }

    const currentHash = hashScheduleSnapshot(result.sch.schedule);
    const match = currentHash === fixture.snapshot;

    const differences = [];
    if (result.sch.makespan !== fixture.makespan) {
        differences.push(
            `Makespan mismatch: ${result.sch.makespan} vs ${fixture.makespan}`,
        );
    }
    if (result.sch.schedule.length !== fixture.taskCount) {
        differences.push(
            `Task count mismatch: ${result.sch.schedule.length} vs ${fixture.taskCount}`,
        );
    }

    return {
        match,
        snapshot: currentHash,
        expectedSnapshot: fixture.snapshot,
        differences,
    };
}

export function generateSchedule(
    dataJSON,
    debug = false,
    scheme = 'LPT',
    priority = false,
    base = 'home',
    boost = 0.05,
    startTime = '07:00',
    endTime = '23:00',
) {
    if (!dataJSON || !dataJSON.buildings || dataJSON.buildings?.length === 0) {
        let resp = { schedule: [], makespan: 0 };
        return {
            sch: resp,
            err: [true, 'Failed to parse building data from JSON'],
        };
    }

    const { tasks, numWorkers, timestamp, warnings } = constructTasks(
        dataJSON,
        scheme,
        priority,
        base,
        boost,
    );

    //  Validate tasks before scheduling
    try {
        const taskWarnings = validateTasks(tasks, warnings);
        warnings.push(...taskWarnings);
    } catch (err) {
        return {
            sch: { schedule: [], makespan: 0 },
            numBuilders: numWorkers,
            startTime: timestamp,
            err: [true, `Task validation failed: ${err.message}`],
        };
    }

    //  Validate active-time window
    try {
        validateActiveTimeWindow(startTime, endTime);
    } catch (err) {
        return {
            sch: { schedule: [], makespan: 0 },
            numBuilders: numWorkers,
            startTime: timestamp,
            err: [true, `Active time validation failed: ${err.message}`],
        };
    }

    const schedule = myScheduler(
        tasks,
        numWorkers,
        timestamp,
        scheme,
        startTime,
        endTime,
        true,
    );

    for (const t of schedule.schedule) {
        t.start_iso = toISOString(t.start);
        t.end_iso = toISOString(t.end);
        t.duration_iso = toISOString(t.duration);
    }

    if (debug) printSchedule(schedule.schedule);

    const errs = warnings.length > 0 ? [false, ...warnings] : [false];

    return {
        sch: schedule,
        numBuilders: numWorkers,
        startTime: timestamp,
        err: errs,
    };
}

/**
 * Get available objective optimization profiles (Phase 8)
 * @returns {Object} - Map of profile keys to profile definitions
 */
export function getObjectiveProfiles() {
    return OBJECTIVE_PROFILES;
}

/**
 * Get profile names for UI display (Phase 8)
 * @returns {Array} - Array of {key, name, description} objects
 */
export function getProfileOptions() {
    return Object.keys(OBJECTIVE_PROFILES).map((key) => ({
        key,
        name: OBJECTIVE_PROFILES[key].name,
        description: OBJECTIVE_PROFILES[key].description,
    }));
}
