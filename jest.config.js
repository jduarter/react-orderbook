const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
	...tsjPreset,
	preset: 'react-native',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	transform: {
		...tsjPreset.transform,
		'\\.js$': '<rootDir>/node_modules/react-native/jest/preprocessor.js',
	},
	testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
	transformIgnorePatterns:['<rootDir>/node_modules/react-native-orientation-locker'],

	testPathIgnorePatterns: ['\\.snap$', '<rootDir>/node_modules/'],
	globals: {
		'ts-jest': {
			babelConfig: true,
		},
	},
	// This is the only part which you can keep
	// from the above linked tutorial's config:
	cacheDirectory: '.jest/cache',
};
