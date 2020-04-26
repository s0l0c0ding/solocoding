require('./plugins/postCategoryPlugin.js');

exports.config = {
  projectRoot: "./src",
  projectName: "soloCoding-blog",
  outDir: './dist/static',
  routes: {
    '/blog/:slug': {
      type: 'contentFolder',
      slug: {
        folder: "./blog"
      }
    },
    '/posts/:categoryId':{
      type: 'categoryIds',
    }
  }
};