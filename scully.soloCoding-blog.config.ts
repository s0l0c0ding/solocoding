import { setPluginConfig, ScullyConfig } from '@scullyio/scully';
import './plugins/postCategoryPlugin.js';
import { DisableAngular } from 'scully-plugin-disable-angular';
import 'prismjs/components/prism-java.js';

const postRenderers = [DisableAngular];
setPluginConfig('md', { enableSyntaxHighlighting: true });
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