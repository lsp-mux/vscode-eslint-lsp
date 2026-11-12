import { execSync } from 'node:child_process';
import manifest from '../package.json' with { type: 'json' };

const tag = `v${manifest.version}`;

try {
  execSync(`gh release view ${tag}`, { stdio: 'ignore' });
  console.log(`Release ${tag} already exists, skipping`);
} catch {
  execSync(`gh release create ${tag} --title ${tag} --generate-notes`, {
    stdio: 'inherit',
  });
}
