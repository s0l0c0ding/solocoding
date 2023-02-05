// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  isPaypalEnabled: false,
  paypalId: 'xx',
  amazonLinks: {
    'java': 'https://www.amazon.com/gp/search?ie=UTF8&tag=solocoding1-20&linkCode=ur2&linkId=e1a278d7cb331c295c41e0a417e37c9d&camp=1789&creative=9325&index=digital-text&keywords=java',
    'angular': 'https://www.amazon.com/gp/search?ie=UTF8&tag=solocoding1-20&linkCode=ur2&linkId=07cf7c8c17668a0a865ce66df3a0d491&camp=1789&creative=9325&index=digital-text&keywords=angular',
    'spring': 'https://www.amazon.com/gp/search?ie=UTF8&tag=solocoding1-20&linkCode=ur2&linkId=2791427e47529a5833e5e21c7436d027&camp=1789&creative=9325&index=digital-text&keywords=spring boot',
    'devops': 'https://www.amazon.com/gp/search?ie=UTF8&tag=solocoding1-20&linkCode=ur2&linkId=74a11ebb78f96a8744e7ab6591a42b94&camp=1789&creative=9325&index=digital-text&keywords=devops',
    'quarkus': 'https://www.amazon.com/gp/search?ie=UTF8&tag=solocoding1-20&linkCode=ur2&linkId=91324d39a17804036568d4e450c285a6&camp=1789&creative=9325&index=digital-text&keywords=quarkus',
    'all': 'https://www.amazon.com/gp/search?ie=UTF8&tag=solocoding1-20&linkCode=ur2&linkId=9aab3cfad9cc70da6c340714bb23ab43&camp=1789&creative=9325&index=digital-text&keywords=software programming'

  },
  isAmazonLinksEnabled: false
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.