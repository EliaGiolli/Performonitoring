/**
 * Query keys that more than one feature touches. The logs feature reads under LOGS_KEY;
 * actions and processes invalidate it after a run (every run writes an audit log), without
 * importing the logs feature.
 */
export const LOGS_KEY = ['logs'] as const;
