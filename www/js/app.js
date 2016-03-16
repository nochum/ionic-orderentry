// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
//, 'pascalprecht.translate'
//, 'tmh.dynamiclocale'
angular.module('starter', [
    'ionic',
    'forceng',
    'starter.controllers',
    'tmh.dynamicLocale',
    'pascalprecht.translate'
])

    .constant('availableLanguages', ['en-US', 'es-MX', 'pt-BR'])
    .constant('defaultLanguage', 'en-US')

    .run(function ($ionicPlatform, $state, $q, force, tmhDynamicLocale, $translate,
                    availableLanguages, $rootScope, defaultLanguage, $locale) {

        function applyLanguage(language) {
            tmhDynamicLocale.set(language.toLowerCase());
        }

        function getSuitableLanguage(language) {
            var index = 0;
            for (index = 0; index < availableLanguages.length; index++) {
                if (availableLanguages[index].toLowerCase() === language.toLocaleLowerCase()) {
                    return availableLanguages[index];
                }
            }
            return defaultLanguage;
        }

        function setLanguage() {
            if (typeof navigator.globalization !== "undefined") {
                navigator.globalization.getPreferredLanguage(
                    function (result) {
                        var language = getSuitableLanguage(result.value);
                        applyLanguage(language);
                        $translate.use(language);
                    },
                    function () {
                        applyLanguage(defaultLanguage);
                    }
                );
            } else {
                applyLanguage(defaultLanguage);
            }
        }
        
        
        
        $ionicPlatform.ready(function () {
            // Use the device's default language
            console.log('before setLanguage()');
            setLanguage();
            console.log('after setLanguage()');
            
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }

			// set to either landscape
//			window.screen.lockOrientation('landscape');

			// allow user rotate
			// window.screen.unlockOrientation();

            // Authenticate using Salesforce OAuth
            force.login().then(function () {
                $state.go('app.accountlist');
            });
            
        });
    })
    
    .config(function (tmhDynamicLocaleProvider, $translateProvider, defaultLanguage) {
        tmhDynamicLocaleProvider.localeLocationPattern('locales/angular-locale_{{locale}}.js');
        
        $translateProvider.useStaticFilesLoader({
            'prefix': 'i18n/',
            'suffix': '.json'
        });
        
        $translateProvider.preferredLanguage(defaultLanguage);
    })
    
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider

            .state('app', {
                url: "/app",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'AppCtrl'
            })

            .state('app.productlist', {
                url: "/productlist/:accountId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/product-list.html",
                        controller: 'ProductListCtrl'
                    }
                }
            })
    
            .state('app.orderconfirm', {
                url: "/orderconfirm",
                views: {
                    'menuContent': {
                        templateUrl: "templates/order-confirm.html",
                        controller: 'OrderConfirmCtrl'
                    }
                },
                params: {
                    orderDetails: {
                        accountId: "",
                        orderTotal: "0.00",
                        orderLines: { array: true }
                    }
                }
            })

            .state('app.accountlist', {
                url: "/accountlist",
                views: {
                    'menuContent': {
                        templateUrl: "templates/account-list.html",
                        controller: 'AccountListCtrl'
                    }
                }
            });
            
    });
