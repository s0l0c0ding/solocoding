import { setPluginConfig, ScullyConfig } from '@scullyio/scully';
import { DisableAngular } from 'scully-plugin-disable-angular';
import './plugins/postCategoryPlugin.js';//extra routes
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-docker.min.js';

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