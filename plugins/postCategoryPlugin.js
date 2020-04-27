const {registerPlugin} = require('@scullyio/scully');

const postCategoryPlugin = async (route, config = {}) => {
  return ([
    {route: '/posts/devops'},
    {route: '/posts/spring'},
    {route: '/posts/angular'},
    {route: '/posts/it'},
  ]);
}

// DO NOT FORGET TO REGISTER THE PLUGIN
const validator = async conf => [];
registerPlugin('router', 'categoryIds', postCategoryPlugin, validator);
