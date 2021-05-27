module.exports = {
    '*.js': ['npx eslint --ext .js src/ --fix', 'npm test', 'npm run sec:detect-secrets'],
    '*.{ts,tsx}': [() => 'tsc --skipLibCheck --noEmit', 'npx eslint --ext .tsx --ext .ts src/ --fix', 'npm test', 'npm run sec:detect-secrets'],
};
