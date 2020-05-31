"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scully_1 = require("@scullyio/scully");
require("./plugins/postCategoryPlugin.js");
var pluginRepository_1 = require("@scullyio/scully/lib/pluginManagement/pluginRepository");
var DisableAngular = require('scully-plugin-disable-angular').DisableAngular;
var postRenderers = [DisableAngular];
scully_1.setPluginConfig('md', pluginRepository_1.pluginTypes[2], { enableSyntaxHighlighting: true });
scully_1.setPluginConfig(DisableAngular, 'render', { removeState: true });
exports.config = {
    projectName: 'soloCoding-blog',
    outDir: './dist/static',
    defaultPostRenderers: postRenderers,
    routes: {
        '/blog/:slug': {
            type: 'contentFolder',
            slug: {
                folder: "./blog"
            }
        },
        '/posts/:categoryId': {
            type: 'categoryIds',
        }
    }
};
