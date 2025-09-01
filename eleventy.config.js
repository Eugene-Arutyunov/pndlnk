module.exports = function (conf) {
  conf.addPassthroughCopy('./src/index.css');
  conf.addPassthroughCopy('./src/ids/colors.css');
  conf.addPassthroughCopy('./src/ids/normalize.css');
  conf.addPassthroughCopy('./src/ids/settings.css');
  conf.addPassthroughCopy('./src/ids/layout.css');
  conf.addPassthroughCopy('./src/ids/ids.css');
  conf.addPassthroughCopy('./src/ids/gallery.css');
  conf.addPassthroughCopy('./src/ids/photoswipe.css');
  conf.addPassthroughCopy('./src/index.js');
  conf.addPassthroughCopy('./src/assets');
  conf.addPassthroughCopy('./src/fonts');

  return {
    dir: {
      input: './src',
      includes: './includes'
    },
    htmlTemplateEngine: 'njk'
  }
}
