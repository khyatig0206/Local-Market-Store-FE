import * as nextBuild from 'next/dist/build/index.js';

console.log('nextBuild keys:', Object.keys(nextBuild));
console.log('default export:', nextBuild.default);

try {
  const buildFn = nextBuild.default?.build ?? nextBuild.build ?? nextBuild.nextBuild;
  console.log('Selected build function typeof:', typeof buildFn);
  await buildFn(process.cwd());
} catch (e) {
  console.error('BUILD FAILED:\n');
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
}
