module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    "nativewind/babel",
    // Add polyfills support
    ["@babel/plugin-transform-runtime",
      {
        "helpers": true,
        "regenerator": true
      }
    ]
  ],
};
