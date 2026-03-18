export type ProjectItemMetadata = {
    completionEffect?: {
        rowColor: string | null;
    } | null;
};

// Vibrant Colors for better intensity
export const COLOR_MAP = {
    RED: '#cd1717',    // Brand Red / Vibrant Red
    AMBER: '#f59e0b',  // Amber 500 (Vibrant Orange)
    EMERALD: '#10b981' // Emerald 500 (Vibrant Green)
};

export const getProjectColor = (project: { items: { status: string, updatedAt: Date, metadata: unknown, title: string }[] }) => {
    const total = project.items.length;
    const done = project.items.filter(i => i.status === 'DONE' || i.status === 'SKIPPED');

    // 1. All Done -> Green (Global Rule)
    if (total > 0 && done.length === total) {
        return { color: COLOR_MAP.EMERALD, label: 'All Completed' };
    }

    // 2. Check for completion effects
    if (done.length > 0) {
        // Sort by latest first
        const sortedDone = [...done].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        // Find the most recent item that has a row effect
        for (const item of sortedDone) {
            const meta = item.metadata as unknown as ProjectItemMetadata;
            const rowColor = meta?.completionEffect?.rowColor;

            if (rowColor) {
                // If it's a valid hex, use it directly (from SOP Color Picker)
                if (rowColor.startsWith('#')) return { color: rowColor, label: item.title };

                // Handle Named Keywords/Classes -> Map to our Vibrant Palette
                const normalized = rowColor.toLowerCase();
                if (normalized.includes('red')) return { color: COLOR_MAP.RED, label: item.title };
                if (normalized.includes('amber')) return { color: COLOR_MAP.AMBER, label: item.title };
                if (normalized.includes('orange')) return { color: COLOR_MAP.AMBER, label: item.title };
                if (normalized.includes('emerald') || normalized.includes('green')) return { color: COLOR_MAP.EMERALD, label: item.title };

                // Fallback for anything else
                return { color: rowColor, label: item.title };
            }
        }
    }
    return null;
};

/**
 * Sanitizes a string to be used as an Excel sheet name.
 * Excel sheet names:
 * 1. Cannot exceed 31 characters.
 * 2. Cannot contain these characters: : \ / ? * [ ]
 * 3. Cannot be empty.
 * 4. Cannot start or end with a single quote (although multiple are allowed, we'll just trim).
 */
export const sanitizeSheetName = (name: string): string => {
    if (!name) return 'Sheet';

    // Replace illegal characters with space
    let sanitized = name.replace(/[:\\/?*\[\]]/g, ' ');

    // Trim whitespace and single quotes
    sanitized = sanitized.trim().replace(/^'|'$/g, '');

    return sanitized || 'Sheet';
};
