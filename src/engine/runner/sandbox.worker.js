// Worker entry point: thin glue between `postMessage` and `executeSubmission`.
// Each run uses a fresh worker that the main thread terminates afterwards. The per-run token is
// kept out of reach of student code, so a fake `postMessage` from it is ignored.
import { createConsoleCapture, installConsole } from './console-capture.js';
import { executeSubmission } from './execute-submission.js';
import { lockdownGlobals } from './lockdown.js';

async function importFromSource(source) {
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  try {
    return await import(/* @vite-ignore */ url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

addEventListener('message', async ({ data }) => {
  if (data?.type !== 'run') {
    return;
  }
  const capture = createConsoleCapture();
  installConsole(globalThis, capture.console);
  lockdownGlobals(globalThis);

  const { token } = data;
  const postResult = postMessage.bind(globalThis);
  const outcome = await executeSubmission({
    studentSource: data.studentSource,
    testsSource: data.testsSource,
    importModule: importFromSource,
  });

  postResult({
    type: 'result',
    token,
    outcome: { ...outcome, logs: capture.entries, droppedLogs: capture.dropped },
  });
});
