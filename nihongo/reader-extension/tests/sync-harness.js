// Bundled by library-sync.test.mjs into the test page. Not part of the extension.
import * as sync from '../src/library-sync.js';
import { openRepo } from '../src/repository.js';
window.__sync = sync;
window.__repoOpen = { openRepo };
