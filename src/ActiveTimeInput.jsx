import React, { useState, useEffect } from 'react';

export default function ActiveTimeInput({
    onChange,
    defaultStart = '08:00',
    defaultEnd = '22:00',
    storageKey = 'activeTime',
}) {
    // Load saved values from localStorage (or fallback to defaults)
    const loadFromStorage = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey));
            if (saved && saved.start && saved.end) {
                return saved;
            }
        } catch {}
        return {
            enabled: false,
            start: defaultStart,
            end: defaultEnd,
        };
    };

    const initial = loadFromStorage();

    const [enabled, setEnabled] = useState(initial.enabled);
    const [startHour, setStartHour] = useState(
        initial.start
            ? initial.start.split(':')[0]
            : defaultStart.split(':')[0],
    );
    const [startMinute, setStartMinute] = useState(
        initial.start
            ? initial.start.split(':')[1]
            : defaultStart.split(':')[1],
    );
    const [endHour, setEndHour] = useState(
        initial.end ? initial.end.split(':')[0] : defaultEnd.split(':')[0],
    );
    const [endMinute, setEndMinute] = useState(
        initial.end ? initial.end.split(':')[1] : defaultEnd.split(':')[1],
    );

    const formatValue = (value) => {
        if (value === '') return '';
        return String(value).padStart(2, '0');
    };

    const toMinutes = (h, m) =>
        parseInt(h || '0', 10) * 60 + parseInt(m || '0', 10);

    const fromMinutes = (mins) => {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return [formatValue(h), formatValue(m)];
    };

    const handleBlur = (setter, value, max, type) => {
        let num = parseInt(value, 10);
        if (isNaN(num)) {
            setter('');
            return;
        }
        if (num < 0) num = 0;
        if (num > max) num = max;
        setter(formatValue(num));

        // Enforce 1-hour minimum gap
        const startTotal = toMinutes(startHour, startMinute);
        const endTotal = toMinutes(endHour, endMinute);

        if (type === 'end') {
            if (endTotal < startTotal + 60) {
                const [h, m] = fromMinutes(startTotal + 60);
                setEndHour(h);
                setEndMinute(m);
            }
        }

        if (type === 'start') {
            if (endTotal < startTotal + 60) {
                const [h, m] = fromMinutes(startTotal + 60);
                setEndHour(h);
                setEndMinute(m);
            }
        }
    };

    // Notify parent + persist in localStorage
    useEffect(() => {
        const payload = {
            enabled,
            start:
                enabled && startHour !== '' && startMinute !== ''
                    ? `${formatValue(startHour)}:${formatValue(startMinute)}`
                    : null,
            end:
                enabled && endHour !== '' && endMinute !== ''
                    ? `${formatValue(endHour)}:${formatValue(endMinute)}`
                    : null,
        };

        try {
            localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch {}

        onChange?.(payload);
    }, [
        enabled,
        startHour,
        startMinute,
        endHour,
        endMinute,
        onChange,
        storageKey,
    ]);

    return (
        <div className="glass-card rounded-2xl p-4 space-y-3">
            <div>
                <label className="text-xs font-semibold text-dark-100 uppercase tracking-wider block mb-2.5">
                    Active Time Range
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-dark-700 bg-dark-800 text-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:ring-offset-2 focus:ring-offset-dark-800 transition-all cursor-pointer"
                    />
                    <span className="text-xs text-dark-200 font-medium group-hover:text-dark-100 transition-colors">
                        Enable Time Window
                    </span>
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Start Time */}
                <div>
                    <label className="text-2xs text-dark-400 font-semibold uppercase tracking-wider block mb-3">
                        Start Time
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={startHour}
                            onChange={(e) => setStartHour(e.target.value)}
                            onBlur={() =>
                                handleBlur(setStartHour, startHour, 23, 'start')
                            }
                            placeholder="HH"
                            disabled={!enabled}
                            className="input-modern w-full px-2.5 py-2 text-center font-mono text-base font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                        <span className="text-dark-500 font-bold text-lg">
                            :
                        </span>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={startMinute}
                            onChange={(e) => setStartMinute(e.target.value)}
                            onBlur={() =>
                                handleBlur(
                                    setStartMinute,
                                    startMinute,
                                    59,
                                    'start',
                                )
                            }
                            placeholder="MM"
                            disabled={!enabled}
                            className="input-modern w-full px-2.5 py-2 text-center font-mono text-base font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* End Time */}
                <div>
                    <label className="text-2xs text-dark-400 font-semibold uppercase tracking-wider block mb-3">
                        End Time
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={endHour}
                            onChange={(e) => setEndHour(e.target.value)}
                            onBlur={() =>
                                handleBlur(setEndHour, endHour, 23, 'end')
                            }
                            placeholder="HH"
                            disabled={!enabled}
                            className="input-modern w-full px-2.5 py-2 text-center font-mono text-base font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                        <span className="text-dark-500 font-bold text-lg">
                            :
                        </span>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={endMinute}
                            onChange={(e) => setEndMinute(e.target.value)}
                            onBlur={() =>
                                handleBlur(setEndMinute, endMinute, 59, 'end')
                            }
                            placeholder="MM"
                            disabled={!enabled}
                            className="input-modern w-full px-2.5 py-2 text-center font-mono text-base font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
