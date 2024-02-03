import { setPluginConfig, ScullyConfig, registerPlugin, httpGetJson, HandledRoute } from '@scullyio/scully';
import { DisableAngular } from 'scully-plugin-disable-angular';
import './plugins/postCategoryPlugin.js';//extra routes
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-docker.min.js';
import  'prismjs/components/prism-bash'
import '@scullyio/scully-plugin-puppeteer';

const EMBED_TWEET_PLUGIN = 'embeddedTweetPlugin';
const EMBED_ADSENSE_PLUGIN = 'embedAdSensePlugin';

async function embeddedTweetPlugin(html: string, route: HandledRoute): Promise<string> {
  const skip = !(route.data?.published && Object.keys(route.data).includes('tweetId'));
  
  if (skip) {
    return Promise.resolve(html);
  }

  const id = route.data?.tweetId;
  const twitterScript = '<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
  const headSplitter = '</head>';
  const [begin, end] = html.split(headSplitter);

  const resp = await httpGetJson(`https://publish.twitter.com/oembed?url=https://twitter.com/s0l0c0ding/status/${id}&partner=&hide_thread=false&align=left`);

  const rawWidget = resp?.['html'];
  const bodySplitter = '</div></app-blog>';
  const [startBody, endBody] = end.split(bodySplitter);
  const widget = ' <div class="row"> <div class="col-lg-8">' + sanatizWidget(rawWidget).split('<script')[0] + '</div></div>';
  html = begin.concat(twitterScript, headSplitter, startBody, widget, bodySplitter, endBody);

  return Promise.resolve(html);
}

function sanatizWidget(rawWidget: string): string {
  return rawWidget.replace('\\n', '').replace('\\u003C', '<').replace('\\u003E', '>').replace('\\', '');
}

async function embedAdsense(html: string, route: HandledRoute): Promise<string> {
  const pathVars = route.route.split('/');
  const dontSkip =  pathVars.includes('posts') || pathVars.includes('blog');
  
  if (dontSkip) {
    const adScript =  '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7493226566481389"crossorigin="anonymous"></script>';
    const headSplitter = '</head>';
    const [begin, end] = html.split(headSplitter);
    html = begin.concat(adScript, headSplitter, end);
    return Promise.resolve(html);
  }
  return Promise.resolve(html);
}

const validator = async () => [];

registerPlugin('postProcessByHtml', EMBED_TWEET_PLUGIN, embeddedTweetPlugin, validator);
registerPlugin('postProcessByHtml', EMBED_ADSENSE_PLUGIN, embedAdsense, validator);


const postRenderers = [DisableAngular, EMBED_TWEET_PLUGIN];
setPluginConfig('md', { enableSyntaxHighlighting: true });
setPluginConfig(DisableAngular, 'postProcessByHtml', { removeState: true });

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
