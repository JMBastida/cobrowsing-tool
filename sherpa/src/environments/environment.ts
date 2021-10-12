// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  BASE_API_URL: 'http://localhost:3001',
  BASE_CALLS_URL: 'http://localhost:3001/v/calls',
  AGORA_APP_ID: '31418e744b9e4da6aace0d0d5ca0d72c',
  COBROWSING_APP_ID: 'COBROWSING_APP_ID',
  DOCS_URLS: {
    BASE: 'https://help.sideby.io',
    IDENTIFY_USERS: 'https://help.sideby.io/docs/en/12061745-identify-users',
    SET_UP_IFRAMES: 'https://help.sideby.io/docs/en/12488428-how-to-setup-iframes',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
