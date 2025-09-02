module.exports = function (conf) {
  conf.addPassthroughCopy("./src/index.css");
  conf.addPassthroughCopy("./src/ids");
  conf.addPassthroughCopy("./src/index.js");
  conf.addPassthroughCopy("./src/assets");
  conf.addPassthroughCopy("./src/fonts");

  return {
    dir: {
      input: "./src",
      includes: "./includes",
    },
    htmlTemplateEngine: "njk",
  };
};
