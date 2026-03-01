import React from 'react';

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

function formatClockOrDate(epochSec, prevEpochSec = null) {
    const d = new Date(epochSec * 1000);

    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    // If day changed since previous tick
    if (prevEpochSec != null) {
        const prev = new Date(prevEpochSec * 1000);
        const dayChanged =
            d.getDate() !== prev.getDate() ||
            d.getMonth() !== prev.getMonth() ||
            d.getFullYear() !== prev.getFullYear();

        if (dayChanged) {
            const dd = String(d.getDate()).padStart(2, '0');
            const mon = String(d.getMonth() + 1).padStart(2, '0');
            return { date: `${dd}/${mon}`, time: timeStr, isDate: true };
        }
    }

    // Default → only time
    return { date: null, time: timeStr, isDate: false };
}

export function TimelineCards({
    tasks = [],
    colorForId,
    doneKeys,
    onToggle,
    taskKeyFn,
}) {
    if (!tasks.length) return null;

    // Chronological order
    const sorted = [...tasks].sort((a, b) => a.start - b.start);
    const workers = tasks.map((item) => item.worker);
    const numWorkers = [...new Set(workers)];
    let makespan = [];

    for (let w of numWorkers) {
        const currMake = tasks
            .filter((t) => t.worker === w)
            .reduce((sum, t) => sum + t.duration, 0);
        makespan[w] = currMake;
    }

    return (
        <div className="space-y-2">
            {sorted.map((t, i) => {
                const dur = Math.max(0, t.duration);
                const k = taskKeyFn(t);
                const isDone = doneKeys?.has(k);
                const workerTasks = sorted.filter((x) => x.worker === t.worker);
                const workerStart = Math.min(
                    ...workerTasks.map((x) => x.start),
                );
                const workerEnd = Math.max(...workerTasks.map((x) => x.end));
                const workerSpan = workerEnd - workerStart || 1;

                const widthPct = (t.duration / workerSpan) * 100;
                const leftPct = ((t.start - workerStart) / workerSpan) * 100;

                return (
                    <div
                        key={k}
                        className={`group relative glass-card rounded-2xl p-4 cursor-pointer transition-all duration-300 ${
                            isDone
                                ? 'opacity-40 grayscale'
                                : 'hover:shadow-card-hover hover:-translate-y-1'
                        }`}
                        onClick={() => onToggle?.(t)}
                        role="button"
                        aria-pressed={isDone}
                        style={{
                            background: isDone
                                ? undefined
                                : `linear-gradient(135deg, ${colorForId(t.id)}20, ${colorForId(t.id)}10)`,
                            borderColor: isDone
                                ? undefined
                                : `${colorForId(t.id)}30`,
                        }}
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-dark-100 mb-1.5 group-hover:text-amber-400 transition-colors">
                                    {String(t.id)
                                        .replaceAll('_', ' ')
                                        .replace('Builder', '')
                                        .trim()}
                                </h3>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded-lg text-xs font-semibold text-amber-400">
                                        Level {t.level}
                                    </span>
                                    <span className="text-xs text-dark-400">
                                        Builder {Number(t.worker) + 1}
                                    </span>
                                    <span className="text-xs text-dark-500">
                                        #{t.iter}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {(() => {
                            const startEpoch = t.start;
                            const endEpoch = t.end;

                            const startLabel = formatClockOrDate(startEpoch);
                            const endLabel = formatClockOrDate(
                                endEpoch,
                                startEpoch,
                            );

                            return (
                                <div className="grid grid-cols-2 gap-2.5 mb-3">
                                    <div>
                                        <div className="text-2xs text-dark-400 uppercase tracking-wider font-semibold mb-1">
                                            Start
                                        </div>
                                        <div className="flex items-center gap-2 font-mono text-sm text-dark-100">
                                            {startLabel.date && (
                                                <span className="font-bold text-amber-400">
                                                    {startLabel.date}
                                                </span>
                                            )}
                                            <span>{startLabel.time}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-2xs text-dark-400 uppercase tracking-wider font-semibold mb-1">
                                            End
                                        </div>
                                        <div className="flex items-center gap-1.5 font-mono text-xs text-dark-100">
                                            {endLabel.date && (
                                                <span className="font-bold text-amber-400">
                                                    {endLabel.date}
                                                </span>
                                            )}
                                            <span>{endLabel.time}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex items-center justify-between mb-3\">
                            <div className="text-xs text-dark-300">
                                Duration:{' '}
                                <span className="font-semibold text-dark-100">
                                    {formatDuration(dur)}
                                </span>
                            </div>
                            <div className="text-xs font-semibold text-amber-400">
                                {Math.round(widthPct)}%
                            </div>
                        </div>

                        <div className="relative h-2 bg-dark-800 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                                style={{
                                    left: `${leftPct}%`,
                                    width: `${widthPct}%`,
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
