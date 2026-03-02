// BuilderTimeline.jsx
import React, { useEffect, useRef } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { BUILDING_COLORS } from './colorMap';

const STYLE_ID = 'gantt-dark-theme';

function getTaskTrackingKey(task, index, taskKeyFn) {
    const fallback =
        task.key ||
        (task.id
            ? `${task.id}|L${task.level}|#${task.iter || 0}`
            : `task-${index}`);
    return taskKeyFn ? taskKeyFn(task) : fallback;
}

function getItemStyle(task, isDone) {
    const nameKey = task.id || task.text || task.name || '';
    let color = BUILDING_COLORS[nameKey] || '#60a5fa';
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) * 0.5);
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) * 0.5);
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) * 0.5);
    color = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;

    return `
        background: ${isDone ? '#3a3a3a' : color};
        border: 1px solid #222222;
        border-radius: 3px;
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        padding: 3px 6px;
        white-space: nowrap;
        opacity: ${isDone ? 0.5 : 0.95};
    `;
}

function formatDuration(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d) return `${d}d ${h}h ${m ? m + 'm' : ''}`.trim();
    if (h) return `${h}h ${m ? m + 'm' : ''}`.trim();
    if (m) return `${m}m ${s ? s + 's' : ''}`.trim();
    return `${s}s`;
}

export default function BuilderTimeline({
    tasks = [],
    start,
    height = 520,
    doneKeys,
    onToggle,
    taskKeyFn,
}) {
    const ref = useRef(null);
    const timelineRef = useRef(null);
    const itemsRef = useRef(null);

    useEffect(() => {
        if (document.getElementById(STYLE_ID)) return;

        const styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = `
            .vis-timeline {
                border: none !important;
            }

            .vis-panel.vis-left,
            .vis-panel.vis-top,
            .vis-labelset,
            .vis-time-axis {
                background: #0a0a0a !important;
            }

            .vis-panel,
            .vis-panel.vis-left,
            .vis-panel.vis-right,
            .vis-panel.vis-top,
            .vis-panel.vis-bottom,
            .vis-panel.vis-center,
            .vis-labelset,
            .vis-time-axis,
            .vis-content,
            .vis-label,
            .vis-group {
                border-color: #333333 !important;
            }

            .vis-label,
            .vis-text {
                color: #b0b0b0 !important;
            }

            .vis-item {
                color: #ffffff !important;
                box-shadow: none !important;
            }

            .vis-grid.vis-vertical,
            .vis-grid.vis-horizontal,
            .vis-grid.vis-minor,
            .vis-grid.vis-major {
                border-color: #333333 !important;
            }
            .vis-grid.vis-major {
                border-color: #444444 !important;
            }
        `;
        document.head.appendChild(styleEl);
    }, []);

    useEffect(() => {
        if (!ref.current) return;

        // destroy previous timeline if any
        if (timelineRef.current) {
            try {
                timelineRef.current.destroy();
            } catch {}
            timelineRef.current = null;
        }

        // build builder groups from `worker` indices (keeps original ordering)
        const workers = Array.from(
            new Set(tasks.map((t) => Number(t.worker || 0))),
        );
        const groups = workers.map((w) => ({
            id: w,
            content: `<div style="color: #b0b0b0; font-weight: 600; font-size: 13px;">Builder ${Number(w) + 1}</div>`,
        }));

        const items = tasks.map((t, i) => {
            const start = new Date((t.start || 0) * 1000);
            const endEpoch =
                t.end != null
                    ? Number(t.end)
                    : (t.start || 0) + (t.duration || 0);
            const end = new Date(Number(endEpoch) * 1000);
            const trackingKey = getTaskTrackingKey(t, i, taskKeyFn);
            const isDone = doneKeys?.has(trackingKey);

            const label = `${String(t.id)
                .replaceAll('_', ' ')
                .replace('Builder', '')
                .trim()}${t.level ? ` L${t.level}` : ''} ${t.iter ? `#${t.iter}` : ''}`;
            const durLabel = formatDuration(
                Number(t.duration || endEpoch - (t.start || 0)),
            );
            const content = `${label} (${durLabel})`;

            // Phase 8: Include objective score in tooltip if available
            let tooltipText = `${content}${isDone ? ' (done)' : ''}`;
            if (t.objectiveScore !== undefined && t.objectiveScore !== null) {
                tooltipText += `\nObjective Score: ${(t.objectiveScore || 0).toFixed(3)}`;
            }

            return {
                id: trackingKey,
                group: Number(t.worker || 0),
                start,
                end,
                content,
                title: tooltipText,
                style: getItemStyle(t, isDone),
            };
        });

        const minStart = Math.min(...tasks.map((t) => t.start)) * 1000; // ms
        const maxEnd = Math.max(...tasks.map((t) => t.end)) * 1000; // ms
        const scheduleSpan = maxEnd - minStart;
        const container = ref.current;
        const options = {
            maxHeight: 600,
            autoResize: true,
            stack: false,
            groupHeightMode: 'auto',
            margin: {
                item: { vertical: 12 }, // 👈 adds vertical padding inside each row
            },
            orientation: { item: 'top' },
            horizontalScroll: true,
            horizontalScrollInvert: true,
            zoomKey: 'ctrlKey',
            zoomable: true,
            zoomMax: scheduleSpan,
            zoomMin: 3600000,
            min: new Date(start * 1000),
            start: new Date(start * 1000),
            end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            showMajorLabels: true,
            showMinorLabels: true,
            showCurrentTime: true,
        };

        itemsRef.current = new DataSet(items);
        timelineRef.current = new Timeline(
            container,
            itemsRef.current,
            new DataSet(groups),
            options,
        );

        if (onToggle) {
            timelineRef.current.on('select', ({ items: selected }) => {
                if (!selected?.length) return;
                const selectedId = String(selected[0]);
                const selectedTask = tasks.find((task, index) => {
                    const key = getTaskTrackingKey(task, index, taskKeyFn);
                    return String(key) === selectedId;
                });
                if (selectedTask) onToggle(selectedTask);
                timelineRef.current?.setSelection([]);
            });
        }

        return () => {
            try {
                timelineRef.current.destroy();
            } catch {}
            timelineRef.current = null;
            itemsRef.current = null;
        };
        // doneKeys intentionally omitted - handled by incremental update effect below
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks, start, height, onToggle, taskKeyFn]);

    useEffect(() => {
        if (!itemsRef.current || !tasks.length) return;

        const updates = tasks.map((task, index) => {
            const trackingKey = getTaskTrackingKey(task, index, taskKeyFn);
            const isDone = doneKeys?.has(trackingKey);
            const endEpoch =
                task.end != null
                    ? Number(task.end)
                    : (task.start || 0) + (task.duration || 0);
            const durLabel = formatDuration(
                Number(task.duration || endEpoch - (task.start || 0)),
            );
            const label = `${String(task.id)
                .replaceAll('_', ' ')
                .replace('Builder', '')
                .trim()}${task.level ? ` L${task.level}` : ''} ${task.iter ? `#${task.iter}` : ''}`;
            const content = `${label} (${durLabel})`;

            return {
                id: trackingKey,
                title: `${content}${isDone ? ' (done)' : ''}`,
                style: getItemStyle(task, isDone),
            };
        });

        itemsRef.current.update(updates);
    }, [doneKeys, tasks, taskKeyFn]);

    return (
        <div
            style={{
                padding: 0,
                width: '100%',
                border: '1px solid #333333',
                borderRadius: 12,
                background: '#111111',
                overflow: 'hidden',
            }}
        >
            <div ref={ref} />
        </div>
    );
}
