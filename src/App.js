import React, { useState } from 'react';
import { generateSchedule } from './scheduler.js';
import { BUILDING_COLORS } from './colorMap';
import { TimelineCards } from './TimelineCards.jsx';
import BuilderTimeline from './BuilderTimeline.jsx';
import ActiveTimeInput from './ActiveTimeInput.jsx';

export function JsonInput({
    label = 'JSON Input',
    initial = '',
    onValid,
    onValidityChange,
    storageKey = 'JSON',
}) {
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

    // Initialize text from localStorage → initial → default ""
    const [text, setText] = React.useState(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);

                // Check timestamp validity
                if (parsed.timestamp) {
                    const ts = parsed.timestamp;
                    const ms = ts < 1e12 ? ts * 1000 : ts;
                    const age = Date.now() - ms;
                    if (age > SIX_HOURS_MS) {
                        console.warn(
                            'Stored JSON expired. Clearing localStorage.',
                        );
                        localStorage.removeItem(storageKey);
                    } else {
                        return stored;
                    }
                } else {
                    // No timestamp field → keep it (optional)
                    return stored;
                }
            }

            if (typeof initial === 'string') return initial;
            return initial ? JSON.stringify(initial) : '';
        } catch (err) {
            console.error('Error loading from localStorage:', err);
            return '';
        }
    });

    const [error, setError] = React.useState('');
    const areaRef = React.useRef(null);

    // Check validity on every change
    const isValid = React.useMemo(() => {
        try {
            JSON.parse(text);
            return true;
        } catch {
            return false;
        }
    }, [text]);

    // Notify parent about validity
    React.useEffect(() => {
        onValidityChange?.(isValid);

        if (isValid) {
            try {
                const obj = JSON.parse(text);
                onValid?.(obj);
                localStorage.setItem(storageKey, JSON.stringify(obj));
            } catch {
                /* should not happen since isValid is true */
            }
        }
    }, [isValid, text, onValid, onValidityChange, storageKey]);

    const handleFormat = () => {
        try {
            const obj = JSON.parse(text);
            setText(JSON.stringify(obj, null, 2));
            setError('');
        } catch (e) {
            setError('Cannot format: ' + e.message);
        }
    };

    const handleClear = () => {
        setText('');
        setError('');
        localStorage.removeItem(storageKey);
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-dark-100 uppercase tracking-wide\">
                Village JSON Data
            </label>

            <textarea
                ref={areaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='{"tag":"#EXAMPLE","buildings":[...]}'
                spellCheck={false}
                className={`input-modern w-full h-[14vh] resize-none font-mono text-xs p-3 rounded-lg ${
                    isValid
                        ? 'border-dark-700'
                        : 'border-red-500/50 bg-red-950/20 ring-2 ring-red-500/20'
                }`}
            />

            <div className="flex gap-2 items-center\">
                <button
                    onClick={handleFormat}
                    className="px-3 py-1.5 bg-dark-800 border border-dark-700 hover:border-amber-400/50 text-dark-100 text-xs font-medium rounded-lg transition-all hover:bg-dark-750\"
                >
                    Format JSON
                </button>
                <button
                    onClick={handleClear}
                    className="px-5 py-2.5 bg-dark-800 border border-dark-700 hover:border-red-500/50 text-dark-100 text-sm font-medium rounded-xl transition-all hover:bg-dark-750"
                >
                    Clear
                </button>

                <div className="flex-1"></div>

                <div
                    className={`flex items-center gap-2 text-sm font-semibold ${
                        isValid ? 'text-amber-400' : 'text-red-400'
                    }`}
                >
                    <div
                        className={`w-2 h-2 rounded-full ${
                            isValid ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                    ></div>
                    {isValid ? 'Valid JSON' : 'Invalid JSON'}
                </div>
            </div>

            {error && <div className="text-sm text-red-400 mt-2">{error}</div>}
        </div>
    );
}

const taskKey = (t) => t.key || `${t.id}|L${t.level}|#${t.iter || 0}`;

const formatDuration = (seconds = 0) => {
    const total = Math.max(0, Number(seconds || 0));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const getTaskCategory = (id = '') => {
    const name = String(id).toLowerCase();
    if (
        name.includes('hero') ||
        name.includes('king') ||
        name.includes('queen') ||
        name.includes('warden') ||
        name.includes('champion') ||
        name.includes('prince')
    )
        return 'Hero';
    if (
        name.includes('mine') ||
        name.includes('collector') ||
        name.includes('storage') ||
        name.includes('drill')
    )
        return 'Resource';
    if (
        name.includes('barracks') ||
        name.includes('laboratory') ||
        name.includes('spell') ||
        name.includes('workshop') ||
        name.includes('camp') ||
        name.includes('clan_castle') ||
        name.includes('pet')
    )
        return 'Offense';
    return 'Defense';
};

// ---- zoom constants + helpers ----
const MIN = 0.005;
const MAX = 7;

export const toPxPerSec = (z) => MIN * Math.pow(MAX / MIN, z);
export const toZoom = (p) => Math.log(p / MIN) / Math.log(MAX / MIN);

// clamp normalized zoom to [ZOOM_MIN, ZOOM_MAX]
const ZOOM_MIN = 0.01;
const ZOOM_MAX = 0.9;
export const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/** ---------- App with exponential zoom ---------- */
export default function App() {
    // const [builders, setBuilders] = useState(5);
    const [jsonData, setJsonData] = React.useState(null);
    const [jsonValid, setJsonValid] = React.useState(false);
    const [doneKeys, setDoneKeys] = React.useState(() => new Set());

    const [tasks, setTasks] = useState([]);
    const [makespan, setMakespan] = useState(0);
    const [startTime, setStartTime] = useState(Math.floor(Date.now() / 1000));
    const [err, setErr] = useState(false);
    const [scheduleType, setScheduleType] = useState(
        'Longest Processing Time (LPT)',
    );
    const [dynamicHeight, setHeight] = useState(300);
    const [activeTime, setActiveTime] = useState({
        enabled: false,
        start: null,
        end: null,
    });

    const [selectedPct, setSelectedPct] = useState(() => {
        const saved = localStorage.getItem('builderBonusPct');
        return saved ? Number(saved) : 0; // default 0% if nothing saved
    });

    const [village, setVillage] = useState(() => {
        const saved = localStorage.getItem('baseVillage');
        return saved ? String(saved) : 'home';
    });

    const [priority, setPriority] = useState(() => {
        const saved = localStorage.getItem('fixedPriority');
        return saved ? saved === 'true' : false;
    });

    React.useEffect(() => {
        localStorage.setItem('builderBonusPct', selectedPct);
        localStorage.setItem('baseVillage', village);
        localStorage.setItem('fixedPriority', priority ? 'true' : 'false');
    }, [selectedPct, village, priority]);

    const scheduleMode = React.useMemo(
        () => (scheduleType.includes('SPT') ? 'SPT' : 'LPT'),
        [scheduleType],
    );
    const doneStorageKey = React.useMemo(() => {
        const playerTag = jsonData?.tag || 'unknown';
        return `doneKeys:${village}:${playerTag}:${scheduleMode}`;
    }, [jsonData?.tag, village, scheduleMode]);

    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(doneStorageKey);
            const parsed = raw ? JSON.parse(raw) : [];
            setDoneKeys(new Set(Array.isArray(parsed) ? parsed : []));
        } catch {
            setDoneKeys(new Set());
        }
    }, [doneStorageKey]);

    React.useEffect(() => {
        localStorage.setItem(doneStorageKey, JSON.stringify([...doneKeys]));
    }, [doneKeys, doneStorageKey]);

    const colorForId = (name) => {
        return BUILDING_COLORS[name] || '#94a3b8'; // fallback gray
    };

    const toggleDone = (task) => {
        const k = taskKey(task);
        setDoneKeys((prev) => {
            const next = new Set(prev);
            next.has(k) ? next.delete(k) : next.add(k);
            return next;
        });
    };

    const runSchedule = (jD, strategy) => {
        if (!jD) {
            console.error('No JSON data provided');
            setErr(true);
            return;
        }
        let activeWindowStart = activeTime.enabled ? activeTime.start : '00:00';
        let activeWindowEnd = activeTime.enabled ? activeTime.end : '23:59';
        const { sch, numBuilders, startTime, err } = generateSchedule(
            jD,
            false,
            strategy,
            priority,
            village,
            selectedPct,
            activeWindowStart,
            activeWindowEnd,
        );
        setErr(err);
        setTasks(sch.schedule);
        setMakespan(sch.makespan);
        setStartTime(startTime);
        setScheduleType(
            strategy === 'SPT'
                ? 'Shortest Processing Time (SPT)'
                : 'Longest Processing Time (LPT)',
        );
        const rowHeight = 40;
        const basePadding = 90; // space for axis/labels
        setHeight(numBuilders * rowHeight + basePadding);

        sch.schedule.forEach((t) => {
            colorForId(t.id);
        });
    };

    const trackerStats = React.useMemo(() => {
        if (!tasks.length) {
            return {
                total: 0,
                completed: 0,
                remaining: 0,
                completionPct: 0,
                remainingDuration: 0,
                byCategory: {},
            };
        }

        let completed = 0;
        let remainingDuration = 0;
        const byCategory = { Defense: 0, Resource: 0, Offense: 0, Hero: 0 };

        tasks.forEach((task) => {
            const done = doneKeys.has(taskKey(task));
            if (done) {
                completed += 1;
                return;
            }

            remainingDuration += Number(task.duration || 0);
            const category = getTaskCategory(task.id);
            byCategory[category] = (byCategory[category] || 0) + 1;
        });

        const total = tasks.length;
        const remaining = total - completed;
        const completionPct = Math.round((completed / total) * 100);

        return {
            total,
            completed,
            remaining,
            completionPct,
            remainingDuration,
            byCategory,
        };
    }, [tasks, doneKeys]);

    const recommendedTasks = React.useMemo(() => {
        return tasks
            .filter((task) => !doneKeys.has(taskKey(task)))
            .map((task) => {
                const priorityBoost = Math.max(
                    0,
                    120 - Number(task.priority || 100) * 8,
                );
                const durationPenalty = Math.min(
                    70,
                    Number(task.duration || 0) / 3600,
                );
                const startsSoonBoost = Math.max(
                    0,
                    48 -
                        (Number(task.start || startTime) - Number(startTime)) /
                            3600,
                );
                const categoryBoost =
                    getTaskCategory(task.id) === 'Resource' ? 8 : 0;
                const score =
                    priorityBoost +
                    startsSoonBoost +
                    categoryBoost -
                    durationPenalty;
                return { ...task, smartScore: score };
            })
            .sort((a, b) => b.smartScore - a.smartScore || a.start - b.start)
            .slice(0, 8);
    }, [tasks, doneKeys, startTime]);

    return (
        <div className="min-h-screen bg-dark-850">
            {/* Subtle grid background */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none"></div>

            <div className="relative">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-2xl font-bold text-dark-100 mb-6">
                        CoC Upgrade Tracker
                    </h1>
                </div>
                {/* Controls Section */}
                <div className="max-w-7xl mx-auto px-6">
                    <div className="glass-card rounded-2xl p-5 mb-6 border border-dark-600">
                        <h2 className="text-lg font-bold text-dark-100 mb-4">
                            Schedule Generator
                        </h2>
                        <div className="grid lg:grid-cols-[1fr,auto] gap-4 mb-0">
                            <JsonInput
                                label="Paste village JSON data"
                                initial={`{"tag":"#GU2QV0Y8Q","timestamp":${Math.floor(Date.now() / 1000)},"buildings":[{"data":1000008,"lvl":10,"gear_up":1},{"data":1000011,"lvl":5,"timer":24973},{"data":1000019,"lvl":4,"timer":28511},{"data":1000019,"lvl":4,"timer":28517},{"data":1000005,"lvl":8,"timer":12591},{"data":1000011,"lvl":4,"timer":5143},{"data":1000000,"lvl":6,"cnt":4},{"data":1000001,"lvl":8,"cnt":1},{"data":1000002,"lvl":11,"cnt":6},{"data":1000003,"lvl":8,"cnt":1},{"data":1000003,"lvl":11,"cnt":2},{"data":1000004,"lvl":11,"cnt":2},{"data":1000004,"lvl":12,"cnt":4},{"data":1000005,"lvl":11,"cnt":2},{"data":1000006,"lvl":10,"cnt":1},{"data":1000007,"lvl":6,"cnt":1},{"data":1000008,"lvl":10,"cnt":4},{"data":1000009,"lvl":9,"cnt":5},{"data":1000010,"lvl":8,"cnt":225},{"data":1000011,"lvl":6,"cnt":1},{"data":1000012,"lvl":6,"cnt":3},{"data":1000013,"lvl":6,"cnt":4},{"data":1000014,"lvl":4,"cnt":1},{"data":1000015,"lvl":1,"cnt":5},{"data":1000019,"lvl":1,"cnt":1},{"data":1000020,"lvl":3,"cnt":1},{"data":1000023,"lvl":3,"cnt":2},{"data":1000024,"lvl":4,"cnt":1},{"data":1000026,"lvl":4,"cnt":1},{"data":1000028,"lvl":4,"cnt":1},{"data":1000029,"lvl":2,"cnt":1},{"data":1000032,"lvl":2,"cnt":1},{"data":1000070,"lvl":1,"cnt":1},{"data":1000071,"lvl":2,"cnt":1}],"traps":[{"data":12000000,"lvl":5,"cnt":6},{"data":12000001,"lvl":1,"cnt":2},{"data":12000001,"lvl":2,"cnt":4},{"data":12000002,"lvl":1,"cnt":1},{"data":12000002,"lvl":2,"cnt":2},{"data":12000005,"lvl":1,"cnt":2},{"data":12000005,"lvl":3,"cnt":2},{"data":12000006,"lvl":1,"cnt":2},{"data":12000008,"lvl":1,"cnt":2}],"decos":[{"data":18000184,"cnt":1}],"obstacles":[{"data":8000000,"cnt":5},{"data":8000004,"cnt":3},{"data":8000006,"cnt":3},{"data":8000007,"cnt":1},{"data":8000008,"cnt":3},{"data":8000010,"lvl":6},{"data":8000013,"cnt":2},{"data":8000131,"cnt":2}],"units":[{"data":4000000,"lvl":4},{"data":4000001,"lvl":4},{"data":4000002,"lvl":4},{"data":4000003,"lvl":4},{"data":4000004,"lvl":4},{"data":4000005,"lvl":4,"timer":17157},{"data":4000006,"lvl":5},{"data":4000007,"lvl":2},{"data":4000008,"lvl":3},{"data":4000009,"lvl":2,"timer":4931},{"data":4000010,"lvl":2},{"data":4000011,"lvl":4},{"data":4000012,"lvl":2},{"data":4000013,"lvl":2}],"siege_machines":[],"heroes":[{"data":28000000,"lvl":11},{"data":28000001,"lvl":6}],"spells":[{"data":26000000,"lvl":4},{"data":26000001,"lvl":4},{"data":26000002,"lvl":5},{"data":26000009,"lvl":2},{"data":26000010,"lvl":2}],"pets":[],"equipment":[{"data":90000000,"lvl":1},{"data":90000001,"lvl":1},{"data":90000002,"lvl":1},{"data":90000003,"lvl":1},{"data":90000004,"lvl":1},{"data":90000005,"lvl":1},{"data":90000006,"lvl":1},{"data":90000007,"lvl":1},{"data":90000008,"lvl":5},{"data":90000010,"lvl":1},{"data":90000013,"lvl":1},{"data":90000014,"lvl":5},{"data":90000015,"lvl":1},{"data":90000019,"lvl":1},{"data":90000022,"lvl":1},{"data":90000032,"lvl":1},{"data":90000035,"lvl":1},{"data":90000039,"lvl":1},{"data":90000040,"lvl":1},{"data":90000041,"lvl":1},{"data":90000042,"lvl":1},{"data":90000043,"lvl":1},{"data":90000048,"lvl":1}],"house_parts":[82000000,82000008,82000009,82000011,82000048,82000058,82000059],"skins":[],"sceneries":[],"buildings2":[{"data":1000039,"lvl":2,"timer":198},{"data":1000033,"lvl":3,"cnt":75},{"data":1000034,"lvl":4,"cnt":1},{"data":1000035,"lvl":4,"cnt":1},{"data":1000036,"lvl":3,"cnt":1},{"data":1000037,"lvl":4,"cnt":1},{"data":1000038,"lvl":4,"cnt":1},{"data":1000040,"lvl":6,"cnt":1},{"data":1000041,"lvl":4,"cnt":1},{"data":1000042,"lvl":1,"cnt":4},{"data":1000043,"lvl":2,"cnt":1},{"data":1000044,"lvl":3,"cnt":2},{"data":1000046,"lvl":4,"cnt":1},{"data":1000048,"lvl":3,"cnt":2},{"data":1000050,"lvl":1,"cnt":1},{"data":1000051,"lvl":2,"cnt":1},{"data":1000054,"lvl":2,"cnt":1},{"data":1000055,"lvl":2,"cnt":1},{"data":1000058,"lvl":2,"cnt":1}],"traps2":[{"data":12000010,"lvl":1,"cnt":2},{"data":12000011,"lvl":1,"cnt":2},{"data":12000011,"lvl":2,"cnt":1},{"data":12000013,"lvl":1,"cnt":3},{"data":12000014,"lvl":1,"cnt":1}],"decos2":[],"obstacles2":[{"data":8000041,"cnt":8},{"data":8000042,"cnt":1},{"data":8000047,"cnt":1},{"data":8000049,"cnt":3},{"data":8000050,"cnt":2},{"data":8000051,"cnt":1},{"data":8000053,"cnt":1},{"data":8000055,"cnt":1},{"data":8000056,"cnt":2},{"data":8000057,"cnt":5},{"data":8000058,"cnt":7},{"data":8000059,"cnt":4},{"data":8000060,"cnt":3},{"data":8000061,"cnt":1},{"data":8000062,"cnt":2},{"data":8000063,"cnt":13},{"data":8000064,"cnt":12}],"units2":[{"data":4000031,"lvl":6},{"data":4000032,"lvl":6},{"data":4000033,"lvl":8},{"data":4000034,"lvl":7},{"data":4000035,"lvl":5},{"data":4000041,"lvl":6,"timer":55487}],"heroes2":[],"skins2":[],"sceneries2":[]}`}
                                onValid={setJsonData}
                                onValidityChange={setJsonValid}
                            />

                            <div className="flex flex-col gap-3">
                                <ActiveTimeInput onChange={setActiveTime} />

                                <div className="glass-card rounded-2xl p-4 space-y-3 bg-dark-750">
                                    <div>
                                        <label className="text-2xs uppercase tracking-widest text-amber-400 font-bold block mb-2">
                                            Builder Bonus
                                        </label>
                                        <select
                                            value={selectedPct}
                                            onChange={(e) =>
                                                setSelectedPct(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="input-modern w-full font-bold text-sm py-2 cursor-pointer"
                                        >
                                            <option value={0}>0%</option>
                                            <option value={0.05}>5%</option>
                                            <option value={0.1}>10%</option>
                                            <option value={0.15}>15%</option>
                                            <option value={0.2}>20%</option>
                                            <option value={0.25}>25%</option>
                                            <option value={0.3}>30%</option>
                                            <option value={0.35}>35%</option>
                                            <option value={0.4}>40%</option>
                                            <option value={0.45}>45%</option>
                                            <option value={0.5}>50%</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-2xs uppercase tracking-widest text-amber-400 font-bold block mb-2">
                                            Select Village
                                        </label>
                                        <select
                                            value={village}
                                            onChange={(e) =>
                                                setVillage(e.target.value)
                                            }
                                            className="input-modern w-full font-bold text-sm py-2 cursor-pointer"
                                        >
                                            <option value={'home'}>
                                                Home Village
                                            </option>
                                            <option value={'builder'}>
                                                Builder Base
                                            </option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between pt-1.5">
                                        <label className="text-2xs uppercase tracking-widest text-amber-400 font-bold">
                                            Fixed Priority
                                        </label>
                                        <input
                                            type="checkbox"
                                            checked={priority}
                                            onChange={(e) =>
                                                setPriority(e.target.checked)
                                            }
                                            className="w-5 h-5 rounded-lg bg-dark-800 border-2 border-dark-700 text-amber-400 focus:ring-2 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-3 pt-3 border-t border-dark-600">
                            <button
                                disabled={!jsonValid}
                                onClick={() => runSchedule(jsonData, 'SPT')}
                                className="btn-primary px-8 py-2.5 text-sm font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                Generate SPT
                            </button>
                            <button
                                disabled={!jsonValid}
                                onClick={() => runSchedule(jsonData, 'LPT')}
                                className="btn-primary px-8 py-2.5 text-sm font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                Generate LPT
                            </button>
                        </div>
                    </div>
                </div>
                {/* Results Sections */}
                <div className="max-w-7xl mx-auto px-6 mt-8">
                    {tasks.length > 0 && (
                        <div>
                            <div className="glass-card rounded-2xl p-8 mb-8">
                                <h2 className="text-xl font-bold text-dark-200 mb-6">
                                    Progress
                                </h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div className="glass-card rounded-2xl p-4 bg-dark-750">
                                            <div className="text-2xs uppercase tracking-widest text-amber-400/60 font-bold mb-1.5">
                                                Completed
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-dark-100">
                                                    {trackerStats.completed}
                                                </span>
                                                <span className="text-base text-dark-400 font-bold">
                                                    / {trackerStats.total}
                                                </span>
                                                <span className="text-amber-400 font-bold text-base ml-auto">
                                                    {trackerStats.completionPct}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                        <div className="glass-card rounded-2xl p-4 bg-dark-750 border border-dark-600">
                                            <div className="text-2xs uppercase tracking-widest text-amber-400/60 font-bold mb-1.5">
                                                Remaining
                                            </div>
                                            <div className="text-2xl font-black text-dark-100">
                                                {trackerStats.remaining}
                                            </div>
                                            <div className="text-xs text-dark-400 mt-0.5 uppercase tracking-wider">
                                                Tasks
                                            </div>
                                        </div>
                                        <div className="glass-card rounded-2xl p-4 bg-dark-750 border border-dark-600">
                                            <div className="text-2xs uppercase tracking-widest text-amber-400/60 font-bold mb-1.5">
                                                Time Left
                                            </div>
                                            <div className="text-2xl font-black text-dark-100">
                                                {formatDuration(
                                                    trackerStats.remainingDuration,
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                        <div className="px-3 py-2 bg-dark-750 backdrop-blur-sm border border-dark-600 rounded-lg\">
                                            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider\">
                                                Defense
                                            </span>
                                            <span className="text-dark-100 font-black text-sm ml-2\">
                                                {trackerStats.byCategory
                                                    .Defense || 0}
                                            </span>
                                        </div>
                                        <div className="px-3 py-2 bg-dark-750 backdrop-blur-sm border border-dark-600 rounded-lg">
                                            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                                                Resource
                                            </span>
                                            <span className="text-dark-100 font-black text-sm ml-2">
                                                {trackerStats.byCategory
                                                    .Resource || 0}
                                            </span>
                                        </div>
                                        <div className="px-3 py-2 bg-dark-750 backdrop-blur-sm border border-dark-600 rounded-lg">
                                            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                                                Offense
                                            </span>
                                            <span className="text-dark-100 font-black text-sm ml-2">
                                                {trackerStats.byCategory
                                                    .Offense || 0}
                                            </span>
                                        </div>
                                        <div className="px-3 py-2 bg-dark-750 backdrop-blur-sm border border-dark-600 rounded-lg">
                                            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                                                Hero
                                            </span>
                                            <span className="text-dark-100 font-black text-sm ml-2">
                                                {trackerStats.byCategory.Hero ||
                                                    0}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="glass-card rounded-2xl overflow-hidden bg-dark-850/30 max-h-[32vh] overflow-y-auto border border-dark-600">
                                        {recommendedTasks.map((task, idx) => (
                                            <div
                                                key={`rec-${taskKey(task)}`}
                                                className={`group border-b border-dark-600 last:border-b-0 hover:bg-amber-400/10 transition-all ${
                                                    idx % 2 === 0
                                                        ? 'bg-dark-800/50'
                                                        : 'bg-dark-850/80'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-4 p-3">
                                                    <div className="flex-1">
                                                        <div className="font-black text-base text-dark-100 mb-1.5 group-hover:text-amber-400 transition-colors">
                                                            {String(
                                                                task.id,
                                                            ).replaceAll(
                                                                '_',
                                                                ' ',
                                                            )}
                                                            <span className="ml-2 px-2.5 py-0.5 bg-amber-400/20 text-amber-400 rounded-lg text-xs font-bold">
                                                                L{task.level}
                                                            </span>
                                                            <span className="ml-2 text-dark-400 text-sm font-medium">
                                                                #{task.iter}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-2xs">
                                                            <span className="px-2 py-0.5 bg-dark-750 text-amber-400/80 rounded-lg border border-dark-600 font-bold uppercase tracking-wider">
                                                                {getTaskCategory(
                                                                    task.id,
                                                                )}
                                                            </span>
                                                            <span className="text-dark-400 font-medium">
                                                                Builder{' '}
                                                                {Number(
                                                                    task.worker,
                                                                ) + 1}
                                                            </span>
                                                            <span className="text-amber-400 font-bold">
                                                                {formatDuration(
                                                                    task.duration,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            toggleDone(task)
                                                        }
                                                        className="btn-primary px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap"
                                                    >
                                                        Mark Done
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {recommendedTasks.length === 0 && (
                                            <div className="p-12 text-center">
                                                <div className="text-5xl mb-4">
                                                    ✓
                                                </div>
                                                <p className="text-dark-400 text-sm font-bold uppercase tracking-wider">
                                                    All upgrades complete
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-5 mb-6">
                                <h2 className="text-lg font-bold text-dark-100 mb-4">
                                    Timeline Chart
                                </h2>

                                <div className="flex items-center justify-between mb-4">
                                    <div className="glass-card rounded-2xl px-4 py-2 bg-dark-750 border border-dark-600">
                                        <span className="text-2xs uppercase tracking-widest text-amber-400/50 font-bold mr-2">
                                            Makespan
                                        </span>
                                        <span className="font-black text-dark-100 text-base">
                                            {makespan}
                                        </span>
                                    </div>
                                    <div className="px-4 py-2 bg-gradient-to-r from-amber-400/15 to-amber-400/15 border border-amber-400/20 rounded-lg">
                                        <span className="font-black text-amber-400 text-sm uppercase tracking-wider">
                                            {scheduleType}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-2xs text-dark-400 mb-2.5 uppercase tracking-wider font-medium\">
                                    Tip: Pinch or Ctrl + Mouse Wheel to zoom
                                </p>
                                <div className="bg-white rounded-2xl shadow-card-lg overflow-hidden">
                                    <BuilderTimeline
                                        tasks={tasks}
                                        start={startTime}
                                        height={dynamicHeight}
                                        doneKeys={doneKeys}
                                        onToggle={toggleDone}
                                        taskKeyFn={taskKey}
                                    />
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-5 mb-6 border border-dark-600">
                                <h2 className="text-lg font-bold text-dark-100 mb-4">
                                    Timeline Cards
                                </h2>
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="glass-card rounded-2xl px-4 py-2 bg-dark-750 border border-dark-600">
                                            <span className="text-2xs uppercase tracking-widest text-amber-400/50 font-bold mr-2">
                                                Makespan
                                            </span>
                                            <span className="font-black text-dark-100 text-base">
                                                {makespan}
                                            </span>
                                        </div>
                                        <div className="px-4 py-2 bg-gradient-to-r from-amber-400/15 to-amber-400/15 border border-amber-400/20 rounded-lg">
                                            <span className="font-black text-amber-400 text-sm uppercase tracking-wider\">
                                                {scheduleType}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="max-h-[42vh] overflow-y-auto pr-2\">
                                        <TimelineCards
                                            tasks={tasks}
                                            colorForId={colorForId}
                                            doneKeys={doneKeys}
                                            onToggle={toggleDone}
                                            taskKeyFn={taskKey}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
