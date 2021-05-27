module.exports = {
	'src/**/*.js': ['npx eslint --ext .js src/ --fix', 'npm test', 'npm run sec:detect-secrets'],
    'src/**/*.{ts,tsx}': [() => 'tsc --skipLibCheck --noEmit', 'npx eslint --ext .tsx --ext .ts src/ --fix', 'npm test', 'npm run sec:detect-secrets'],
};
