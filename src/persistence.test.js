import {
    loadPersisted,
    migratePersistenceIfNeeded,
    persistenceKeys,
    savePersisted,
} from './persistence';

describe('persistence', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('loadPersisted falls back and removes corrupted payload', () => {
        localStorage.setItem(persistenceKeys.settings, '{bad json');

        const value = loadPersisted(persistenceKeys.settings, {
            baseVillage: 'home',
        });

        expect(value).toEqual({ baseVillage: 'home' });
        expect(localStorage.getItem(persistenceKeys.settings)).toBeNull();
    });

    test('loadPersisted falls back and removes checksum-invalid payload', () => {
        const payload = {
            version: persistenceKeys.SCHEMA_VERSION,
            updatedAt: Date.now(),
            checksum: 'invalid',
            value: { baseVillage: 'builder' },
        };

        localStorage.setItem(persistenceKeys.settings, JSON.stringify(payload));

        const value = loadPersisted(persistenceKeys.settings, {
            baseVillage: 'home',
        });

        expect(value).toEqual({ baseVillage: 'home' });
        expect(localStorage.getItem(persistenceKeys.settings)).toBeNull();
    });

    test('migrates legacy keys once and preserves done-state scope', () => {
        localStorage.setItem('builderBonusPct', '0.25');
        localStorage.setItem('baseVillage', 'builder');
        localStorage.setItem('fixedPriority', 'true');
        localStorage.setItem('preferredStrategy', 'SPT');
        localStorage.setItem('JSON', JSON.stringify({ tag: '#ABC123' }));
        localStorage.setItem(
            'doneKeys:home:#ABC123:SPT',
            JSON.stringify(['a|L1|#0', 'b|L2|#0']),
        );

        migratePersistenceIfNeeded();

        const settings = loadPersisted(persistenceKeys.settings, null);
        const migratedDone = loadPersisted(
            persistenceKeys.done({
                village: 'home',
                playerTag: '#ABC123',
                strategy: 'SPT',
            }),
            [],
        );

        expect(settings).toEqual({
            builderBonusPct: 0.25,
            baseVillage: 'builder',
            fixedPriority: true,
            preferredStrategy: 'SPT',
        });
        expect(migratedDone).toEqual(['a|L1|#0', 'b|L2|#0']);
        expect(localStorage.getItem(persistenceKeys.migrationMarker)).toBe(
            'true',
        );

        savePersisted(persistenceKeys.settings, {
            builderBonusPct: 0,
            baseVillage: 'home',
            fixedPriority: false,
            preferredStrategy: 'LPT',
        });
        migratePersistenceIfNeeded();

        const settingsAfterSecondRun = loadPersisted(
            persistenceKeys.settings,
            null,
        );
        expect(settingsAfterSecondRun.baseVillage).toBe('home');
    });
});
