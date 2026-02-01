module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          disableImportExportTransform: false,
        },
      ],
      "nativewind/babel",
    ],
    overrides: [
      {
        test: ["./node_modules/expo-router"],
        plugins: [
          [
            "@babel/plugin-transform-runtime",
            {
              corejs: false,
            },
          ],
        ],
      },
    ],
  };
};
