// Evidence merges this into its own SvelteKit config (kit.files and preprocess are ignored).
//
// The page links out to other pages on the same site (/, /disclaimer/, /projects/uen-sheet/ ...).
// SvelteKit's prerender crawler would try to fetch them under Evidence's base path and fail the
// build with a 404. Links outside the base path are not ours to check, so skip them. A broken
// link INSIDE the base path still fails the build.
import { getEvidenceConfig } from '@evidence-dev/sdk/config';

const base = getEvidenceConfig().deployment.basePath || '';

export default {
	kit: {
		prerender: {
			handleHttpError: ({ path, message }) => {
				if (base && !path.startsWith(base)) return;
				throw new Error(message);
			}
		}
	}
};
