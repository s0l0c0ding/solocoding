import { setPluginConfig, ScullyConfig } from '@scullyio/scully';
import './plugins/postCategoryPlugin.js';
import { pluginTypes } from '@scullyio/scully/lib/pluginManagement/pluginRepository';

setPluginConfig('md', pluginTypes[2] ,{ enableSyntaxHighlighting: true });

export const config: ScullyConfig = {
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