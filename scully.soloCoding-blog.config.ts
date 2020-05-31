import { setPluginConfig, ScullyConfig } from '@scullyio/scully';
import './plugins/postCategoryPlugin.js';
import { pluginTypes } from '@scullyio/scully/lib/pluginManagement/pluginRepository';


const { DisableAngular } = require('scully-plugin-disable-angular');
const postRenderers = [DisableAngular];
setPluginConfig('md', pluginTypes[2], { enableSyntaxHighlighting: true });
setPluginConfig(DisableAngular, 'render', {removeState: true});

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