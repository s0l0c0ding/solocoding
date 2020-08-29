const {registerPlugin} = require('@scullyio/scully');

const postCategoryPlugin = async (route, config = {}) => {
  return ([
    {route: '/posts/devops'},
    {route: '/posts/spring'},
    {route: '/posts/angular'},
    {route: '/posts/it'},
    {route: '/posts/it_devops'},
    {route: '/posts/it_spring'},
    {route: '/posts/it_angular'}
  ]);
}

// DO NOT FORGET TO REGISTER THE PLUGIN
const validator = async conf => [];
registerPlugin('router', 'categoryIds', postCategoryPlugin, validator);
