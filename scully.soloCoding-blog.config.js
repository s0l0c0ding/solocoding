"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scully_1 = require("@scullyio/scully");
require("./plugins/postCategoryPlugin.js");
var pluginRepository_1 = require("@scullyio/scully/lib/pluginManagement/pluginRepository");
scully_1.setPluginConfig('md', pluginRepository_1.pluginTypes[2], { enableSyntaxHighlighting: true });
exports.config = {
    projectName: 'soloCoding-blog',
    outDir: './dist/static',
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
