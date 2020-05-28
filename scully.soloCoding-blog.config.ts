import { setPluginConfig, ScullyConfig } from '@scullyio/scully';
import './plugins/postCategoryPlugin.js';
import { pluginTypes } from '@scullyio/scully/lib/pluginManagement/pluginRepository';

setPluginConfig('md', pluginTypes[2] ,{ enableSyntaxHighlighting: true });
const {DisableAngular} = require('scully-plugin-disable-angular');
const postRenderers = [DisableAngular];

export const config: ScullyConfig = {
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