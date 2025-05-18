module.exports = {
  assets: ['./assets/fonts/'],
  dependencies: {
    'react-native-sound': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-sound/android',
        },
      },
    },
    '@react-native-community/slider': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@react-native-community/slider/android',
        },
      },
    },
    'react-native-vector-icons': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-vector-icons/android',
        },
      },
    },
  },
};
