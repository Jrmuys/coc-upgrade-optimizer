/**
 * Input Layer Validation
 * Validates exported JSON from Clash of Clans game
 * Returns structured validation results with warnings and errors
 */

const REQUIRED_BASE_FIELDS = ['buildings', 'heroes'];
const REQUIRED_BUILDER_BASE_FIELDS = ['buildings2', 'heroes2'];

// Reserved for future validation enhancements
// eslint-disable-next-line no-unused-vars
const VALID_BUILDING_FIELDS = ['data', 'lvl', 'cnt', 'timer', 'gear_up'];
// eslint-disable-next-line no-unused-vars
const VALID_HERO_FIELDS = ['data', 'lvl', 'timer'];

/**
 * Comprehensive JSON input validation
 * @param {Object} dataJSON - Exported player data from CoC
 * @param {string} baseMode - 'home' or 'builder'
 * @returns {Object} { valid: boolean, errors: [], warnings: [], data: sanitized_data }
 */
export function validatePlayerJSON(dataJSON, baseMode = 'home') {
    const errors = [];
    const warnings = [];
    let sanitizedData = JSON.parse(JSON.stringify(dataJSON)); // Deep copy

    // Check for null/undefined
    if (!dataJSON || typeof dataJSON !== 'object') {
        errors.push(
            'Input data is not a valid object. Did you paste valid JSON?',
        );
        return { valid: false, errors, warnings, data: null };
    }

    // Validate base-specific required fields
    const requiredFields =
        baseMode === 'home'
            ? REQUIRED_BASE_FIELDS
            : REQUIRED_BUILDER_BASE_FIELDS;
    const missingFields = requiredFields.filter((f) => !dataJSON[f]);

    if (missingFields.length > 0) {
        errors.push(
            `Missing required fields for ${baseMode} base: ${missingFields.join(', ')}. ` +
                `Are you sure this is an exported ${baseMode} base JSON?`,
        );
        return { valid: false, errors, warnings, data: null };
    }

    // Validate buildings array structure
    const buildingsKey = baseMode === 'home' ? 'buildings' : 'buildings2';
    if (!Array.isArray(dataJSON[buildingsKey])) {
        errors.push(
            `${buildingsKey} must be an array, got ${typeof dataJSON[buildingsKey]}`,
        );
        return { valid: false, errors, warnings, data: null };
    }

    // Validate each building
    let invalidBuildingCount = 0;
    const validBuildings = sanitizedData[buildingsKey].filter((b, idx) => {
        if (!b || typeof b !== 'object') {
            invalidBuildingCount++;
            return false;
        }

        // Check required fields
        if (b.data === undefined || b.lvl === undefined) {
            invalidBuildingCount++;
            return false;
        }

        // Validate data and lvl are numbers
        if (typeof b.data !== 'number' || typeof b.lvl !== 'number') {
            invalidBuildingCount++;
            return false;
        }

        // Validate level is reasonable (buildings can reach 16+ at high TH levels)
        if (b.lvl < 1 || b.lvl > 65) {
            warnings.push(`Building index ${idx} has unusual level: ${b.lvl}`);
        }

        // Handle optional fields
        const timer = b.timer;

        // Coerce timer to number if it's a string
        if (timer !== undefined && typeof timer === 'string') {
            const parsed = parseInt(timer, 10);
            if (!isNaN(parsed)) {
                b.timer = parsed;
            } else {
                warnings.push(
                    `Building ${b.data} has non-numeric timer: "${timer}", ignoring`,
                );
                delete b.timer;
            }
        }

        return true;
    });

    if (invalidBuildingCount > 0) {
        warnings.push(
            `${invalidBuildingCount} malformed building(s) were skipped (missing data or lvl fields)`,
        );
    }

    sanitizedData[buildingsKey] = validBuildings;

    // Validate heroes array
    const heroesKey = baseMode === 'home' ? 'heroes' : 'heroes2';
    if (!Array.isArray(dataJSON[heroesKey])) {
        errors.push(
            `${heroesKey} must be an array, got ${typeof dataJSON[heroesKey]}`,
        );
        return { valid: false, errors, warnings, data: sanitizedData };
    }

    let invalidHeroCount = 0;
    const validHeroes = sanitizedData[heroesKey].filter((h, idx) => {
        if (!h || typeof h !== 'object') {
            invalidHeroCount++;
            return false;
        }

        if (h.data === undefined || h.lvl === undefined) {
            invalidHeroCount++;
            return false;
        }

        if (typeof h.data !== 'number' || typeof h.lvl !== 'number') {
            invalidHeroCount++;
            return false;
        }

        if (h.lvl < 1 || h.lvl > 65) {
            warnings.push(`Hero index ${idx} has unusual level: ${h.lvl}`);
        }

        // Coerce timer to number if present
        if (h.timer !== undefined && typeof h.timer === 'string') {
            const parsed = parseInt(h.timer, 10);
            if (!isNaN(parsed)) {
                h.timer = parsed;
            } else {
                warnings.push(
                    `Hero ${h.data} has non-numeric timer: "${h.timer}", ignoring`,
                );
                delete h.timer;
            }
        }

        return true;
    });

    if (invalidHeroCount > 0) {
        warnings.push(
            `${invalidHeroCount} malformed hero(es) were skipped (missing data or lvl fields)`,
        );
    }

    sanitizedData[heroesKey] = validHeroes;

    // Validate timestamp if present
    if (dataJSON.timestamp !== undefined) {
        if (typeof dataJSON.timestamp !== 'number') {
            warnings.push('Timestamp is not a number, will use current time');
            delete sanitizedData.timestamp;
        } else {
            // Check if timestamp is reasonable (not too old or in future)
            const now = Math.floor(Date.now() / 1000);
            const ageSeconds = now - dataJSON.timestamp;
            const maxAge = 30 * 24 * 60 * 60; // 30 days

            if (ageSeconds > maxAge) {
                warnings.push(
                    `Export is ${Math.floor(ageSeconds / (24 * 60 * 60))} days old. Schedule may not be accurate.`,
                );
            } else if (ageSeconds < 0) {
                warnings.push(
                    'Timestamp is in the future, using current time instead',
                );
                delete sanitizedData.timestamp;
            }
        }
    }

    // Validate traps if present
    const trapsKey = baseMode === 'home' ? 'traps' : 'traps2';
    if (dataJSON[trapsKey] !== undefined) {
        if (!Array.isArray(dataJSON[trapsKey])) {
            warnings.push(`${trapsKey} is not an array, ignoring`);
            delete sanitizedData[trapsKey];
        }
    }

    // Generate preflight summary
    const summary = generatePreflight(sanitizedData, baseMode);

    const valid =
        errors.length === 0 &&
        validBuildings.length > 0 &&
        validHeroes.length >= 0;

    return {
        valid,
        errors,
        warnings,
        data: sanitizedData,
        summary,
    };
}

/**
 * Generates a preflight summary before schedule generation
 * Shows what will be scheduled
 */
export function generatePreflight(data, baseMode) {
    const buildingsKey = baseMode === 'home' ? 'buildings' : 'buildings2';
    const heroesKey = baseMode === 'home' ? 'heroes' : 'heroes2';

    const buildings = data[buildingsKey] || [];
    const heroes = data[heroesKey] || [];

    const ongoingBuildings = buildings.filter((b) => b.timer).length;
    const ongoingHeroes = heroes.filter((h) => h.timer).length;

    return {
        baseMode,
        totalBuildings: buildings.length,
        ongoingBuildings,
        totalHeroes: heroes.length,
        ongoingHeroes,
        message:
            `Ready to schedule: ${buildings.length} buildings ` +
            `(${ongoingBuildings} upgrading), ${heroes.length} heroes ` +
            `(${ongoingHeroes} upgrading)`,
    };
}

/**
 * Validates a configuration object for required structure
 * @param {Object} config - Configuration object (mapping, priority, etc)
 * @param {string} configName - Name of config for error messages
 * @returns {Object} { valid: boolean, errors: [] }
 */
export function validateConfig(config, configName = 'config') {
    const errors = [];

    if (!config || typeof config !== 'object') {
        errors.push(`${configName} is not a valid object`);
        return { valid: false, errors };
    }

    // Check if config is empty
    if (Object.keys(config).length === 0) {
        errors.push(`${configName} is empty`);
        return { valid: false, errors };
    }

    return { valid: true, errors: [] };
}

/**
 * Machine-readable validation result
 * Used by schedulers and UIs to decide next action
 */
export function createValidationResult(validation) {
    return {
        succeeded: validation.valid && validation.errors.length === 0,
        canSchedule: validation.valid && validation.data !== null,
        hasCriticalErrors: validation.errors.length > 0,
        hasWarnings: validation.warnings.length > 0,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        errors: validation.errors,
        warnings: validation.warnings,
        summary: validation.summary,
        data: validation.data,
    };
}

/**
 * User-friendly error message formatter
 * Turns validation errors into actionable guidance
 */
export function formatValidationMessage(validation) {
    const lines = [];

    if (validation.errors.length > 0) {
        lines.push('❌ Issues found:');
        validation.errors.forEach((err) => {
            lines.push(`  • ${err}`);
        });
    }

    if (validation.warnings.length > 0) {
        lines.push('⚠️ Warnings:');
        validation.warnings.slice(0, 5).forEach((warn) => {
            lines.push(`  • ${warn}`);
        });
        if (validation.warnings.length > 5) {
            lines.push(
                `  ... and ${validation.warnings.length - 5} more warnings`,
            );
        }
    }

    if (validation.summary && validation.valid) {
        lines.push(`✅ ${validation.summary.message}`);
    }

    return lines.join('\n');
}
