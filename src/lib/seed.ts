import type { WorkspaceData } from './types'
import seed from './seed.json'

/**
 * Initial dataset loaded into browser storage on first run — imported from the
 * Focused List (PhishSheriff) contact sheet. After first load the user's own
 * edits in localStorage take over.
 */
export const SEED = seed as unknown as WorkspaceData
