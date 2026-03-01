const SCHEMA_VERSION = 1;
const PREFIX = `cocTracker:v${SCHEMA_VERSION}`;
const MIGRATION_MARKER = `${PREFIX}:migration:done`;

const KEY_SETTINGS = `${PREFIX}:settings`;
const KEY_JSON_DRAFT = `${PREFIX}:jsonDraft`;
const KEY_ACTIVE_TIME = (village) => `${PREFIX}:activeTime:${village}`;
const KEY_DONE = ({ village, playerTag, strategy }) =>
    `${PREFIX}:done:${village}:${playerTag || 'unknown'}:${strategy}`;

const logDebug = (...args) => {
    if (process.env.NODE_ENV !== 'production') {
        console.debug('[persistence]', ...args);
    }
};

const toStringSafe = (value) => {
    try {
        return JSON.stringify(value);
    } catch {
        return '';
    }
};

const checksum = (value) => {
    const raw = toStringSafe(value);
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i += 1) {
        hash ^= raw.charCodeAt(i);
        hash +=
            (hash << 1) +
            (hash << 4) +
            (hash << 7) +
            (hash << 8) +
            (hash << 24);
    }
    return `h${(hash >>> 0).toString(16)}`;
};

const makeEnvelope = (value) => ({
    version: SCHEMA_VERSION,
    updatedAt: Date.now(),
    checksum: checksum(value),
    value,
});

const isEnvelopeValid = (payload) => {
    if (!payload || typeof payload !== 'object') return false;
    if (payload.version !== SCHEMA_VERSION) return false;
    if (!Object.prototype.hasOwnProperty.call(payload, 'value')) return false;
    if (payload.checksum !== checksum(payload.value)) return false;
    return true;
};

const readRaw = (key) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const writeRaw = (key, value) => {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
};

const removeRaw = (key) => {
    try {
        localStorage.removeItem(key);
    } catch {
        // no-op
    }
};

export const loadPersisted = (key, fallbackValue) => {
    const raw = readRaw(key);
    if (!raw) return fallbackValue;

    try {
        const parsed = JSON.parse(raw);
        if (isEnvelopeValid(parsed)) {
            return parsed.value;
        }
        removeRaw(key);
        logDebug('invalid payload removed', key);
        return fallbackValue;
    } catch {
        removeRaw(key);
        logDebug('corrupted payload removed', key);
        return fallbackValue;
    }
};

export const savePersisted = (key, value) => {
    const payload = makeEnvelope(value);
    return writeRaw(key, JSON.stringify(payload));
};

export const removePersisted = (key) => {
    removeRaw(key);
};

const getOldDoneKeys = () => {
    try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (key && key.startsWith('doneKeys:')) {
                keys.push(key);
            }
        }
        return keys;
    } catch {
        return [];
    }
};

export const migratePersistenceIfNeeded = () => {
    if (readRaw(MIGRATION_MARKER) === 'true') {
        return;
    }

    try {
        const oldSettings = {
            builderBonusPct: Number(readRaw('builderBonusPct') || 0),
            baseVillage: readRaw('baseVillage') || 'home',
            fixedPriority: readRaw('fixedPriority') === 'true',
            preferredStrategy:
                readRaw('preferredStrategy') === 'SPT' ? 'SPT' : 'LPT',
        };
        savePersisted(KEY_SETTINGS, oldSettings);

        const legacyJson = readRaw('JSON');
        if (legacyJson) {
            try {
                savePersisted(KEY_JSON_DRAFT, JSON.parse(legacyJson));
            } catch {
                // ignore malformed legacy draft
            }
        }

        ['home', 'builder'].forEach((village) => {
            const activeKey = `activeTime:${village}`;
            const raw = readRaw(activeKey);
            if (!raw) return;
            try {
                savePersisted(KEY_ACTIVE_TIME(village), JSON.parse(raw));
            } catch {
                // ignore malformed active-time payload
            }
        });

        getOldDoneKeys().forEach((oldKey) => {
            const raw = readRaw(oldKey);
            if (!raw) return;
            const [, village, playerTag, strategy] = oldKey.split(':');
            try {
                const parsed = JSON.parse(raw);
                const doneArray = Array.isArray(parsed) ? parsed : [];
                savePersisted(
                    KEY_DONE({ village, playerTag, strategy }),
                    doneArray,
                );
            } catch {
                // ignore malformed done-state payload
            }
        });

        writeRaw(MIGRATION_MARKER, 'true');
        logDebug('migration complete', { schema: SCHEMA_VERSION });
    } catch (error) {
        logDebug('migration failed', error);
    }
};

export const persistenceKeys = {
    SCHEMA_VERSION,
    settings: KEY_SETTINGS,
    jsonDraft: KEY_JSON_DRAFT,
    activeTime: KEY_ACTIVE_TIME,
    done: KEY_DONE,
    migrationMarker: MIGRATION_MARKER,
};

export const cleanupStaleDoneState = ({
    village,
    playerTag,
    strategy,
    keepDays = 45,
}) => {
    const activeKey = KEY_DONE({ village, playerTag, strategy });
    const maxAgeMs = keepDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    try {
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (
                !key ||
                !key.startsWith(`${PREFIX}:done:`) ||
                key === activeKey
            ) {
                continue;
            }
            const raw = readRaw(key);
            if (!raw) continue;
            try {
                const parsed = JSON.parse(raw);
                const age = now - Number(parsed?.updatedAt || 0);
                if (!Number.isFinite(age) || age > maxAgeMs) {
                    removeRaw(key);
                }
            } catch {
                removeRaw(key);
            }
        }
    } catch {
        // ignore storage scan failures
    }
};
