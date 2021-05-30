module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.js', '.ts', '.tsx', '.json'],
        alias: {
          '@atoms': './src/atoms',
          '@components': './src/components',
          '@hooks': './src/hooks',
          '@screens': './src/screens',
          '@utils': './src/utils',
        },
      },
    ],
  ],
};
