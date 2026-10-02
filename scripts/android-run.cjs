// Builds the test version and installs it on the connected phone.
// Fills in JAVA_HOME / ANDROID_HOME when the terminal doesn't have them (e.g. opened before they were set).
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const local = process.env.LOCALAPPDATA || '';
const defaults = { JAVA_HOME: path.join(local, 'Programs', 'jdk-21'), ANDROID_HOME: path.join(local, 'Android', 'Sdk') };
for (const [name, dir] of Object.entries(defaults)) {
  if ((!process.env[name] || !fs.existsSync(process.env[name])) && fs.existsSync(dir)) process.env[name] = dir;
}

const run = (cmd) => {
  const r = spawnSync(cmd, { stdio: 'inherit', shell: true, env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run('npm run android:test');
run('npx cap run android ' + process.argv.slice(2).join(' '));
