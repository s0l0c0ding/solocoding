const {registerPlugin} = require('@scullyio/scully');

const postCategoryPlugin = async (route, config = {}) => {
  return Promise.resolve([
    {route: '/posts/devops'},
    {route: '/posts/spring'},
    {route: '/posts/angular'},
  ]);
}

// DO NOT FORGET TO REGISTER THE PLUGIN
const validator = async conf => [];
registerPlugin('router', 'categoryIds', postCategoryPlugin, validator);
//exports.postCategoryPlugin = postCategoryPlugin;