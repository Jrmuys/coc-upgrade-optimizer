// BuilderTimeline.jsx
import React, { useEffect, useRef } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { BUILDING_COLORS } from './colorMap';

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

        // create items for vis-timeline
        const items = tasks.map((t, i) => {
            const start = new Date((t.start || 0) * 1000);
            const endEpoch =
                t.end != null
                    ? Number(t.end)
                    : (t.start || 0) + (t.duration || 0);
            const end = new Date(Number(endEpoch) * 1000);
            const fallbackKey =
                t.key ||
                (t.id ? `${t.id}|L${t.level}|#${t.iter || 0}` : `task-${i}`);
            const trackingKey = taskKeyFn ? taskKeyFn(t) : fallbackKey;
            const isDone = doneKeys?.has(trackingKey);

            const nameKey = t.id || t.text || t.name || '';
            let color = BUILDING_COLORS[nameKey] || '#60a5fa'; // fallback blue

            // Darken the color for better contrast with white text
            // Convert hex to RGB, darken, convert back
            const hex = color.replace('#', '');
            const r = Math.max(0, parseInt(hex.substring(0, 2), 16) * 0.5);
            const g = Math.max(0, parseInt(hex.substring(2, 4), 16) * 0.5);
            const b = Math.max(0, parseInt(hex.substring(4, 6), 16) * 0.5);
            color = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;

            const label = `${String(t.id)
                .replaceAll('_', ' ')
                .replace('Builder', '')
                .trim()}${t.level ? ` L${t.level}` : ''} ${t.iter ? `#${t.iter}` : ''}`;
            const durLabel = formatDuration(
                Number(t.duration || endEpoch - (t.start || 0)),
            );
            const content = `${label} (${durLabel})`;

            return {
                id: trackingKey || fallbackKey,
                group: Number(t.worker || 0),
                start,
                end,
                content,
                title: `${content}${isDone ? ' (done)' : ''}`,
                style: `
					background: ${isDone ? '#3a3a3a' : color};
					border: 1px solid #222222;
					border-radius: 3px;
					color: #ffffff;
					font-size: 12px;
					font-weight: 600;
					padding: 3px 6px;
					white-space: nowrap;
					opacity: ${isDone ? 0.5 : 0.95};
				`,
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

        timelineRef.current = new Timeline(
            container,
            new DataSet(items),
            new DataSet(groups),
            options,
        );

        if (onToggle) {
            timelineRef.current.on('select', ({ items: selected }) => {
                if (!selected?.length) return;
                const selectedId = String(selected[0]);
                const selectedTask = tasks.find((task, index) => {
                    const fallback =
                        task.key ||
                        (task.id
                            ? `${task.id}|L${task.level}|#${task.iter || 0}`
                            : `task-${index}`);
                    const key = taskKeyFn ? taskKeyFn(task) : fallback;
                    return String(key || fallback) === selectedId;
                });
                if (selectedTask) onToggle(selectedTask);
                timelineRef.current?.setSelection([]);
            });
        }

        // Minimal dark theme color overrides
        const styleId = 'gantt-dark-theme';
        let styleEl = document.getElementById(styleId);
        if (styleEl) styleEl.remove();

        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
      /* Remove outer border */
      .vis-timeline {
        border: none !important;
      }
      
      /* Dark backgrounds */
      .vis-panel.vis-left,
      .vis-panel.vis-top,
      .vis-labelset,
      .vis-time-axis {
        background: #0a0a0a !important;
      }
      
      /* ALL borders dark gray - comprehensive */
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
      
      /* Text colors */
      .vis-label,
      .vis-text {
        color: #b0b0b0 !important;
      }
      
      /* Task items */
      .vis-item {
        color: #ffffff !important;
        box-shadow: none !important;
      }
      
      /* Grid lines dark */
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

        return () => {
            try {
                timelineRef.current.destroy();
            } catch {}
            if (styleEl && styleEl.parentNode) {
                styleEl.parentNode.removeChild(styleEl);
            }
        };
    }, [tasks, start, height, doneKeys, onToggle, taskKeyFn]);

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
