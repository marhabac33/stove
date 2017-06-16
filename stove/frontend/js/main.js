var main = (function() {
    "use strcit";

    var main = angular.module("main", ['ngRoute', 'ngMap', 'google.places', 'infinite-scroll']);

    main.config(['$routeProvider', '$locationProvider', '$qProvider', function($routeProvider, $locationProvider, $qProvider) {
        $routeProvider.when('/profile', {
            templateUrl: '/partials/profile.html',
            controller: 'profileCtrl'
        });
        $routeProvider.when('/editprofile', {
            templateUrl: '/partials/editprofile.html',
            controller: 'profileCtrl'
        });
        $routeProvider.when('/history', {
            templateUrl: '/partials/history.html',
            controller: 'historyCtrl'
        });
        $routeProvider.when('/', {
            templateUrl: '/partials/home.html',
            controller: 'mainCtrl'
        });
        $routeProvider.otherwise({
            redirectTo: '/'
        });

        $locationProvider.html5Mode({
            enable: true,
            requireBase: false
        });

        $qProvider.errorOnUnhandledRejections(false);
    }]);

    angular.module('main').run(['$rootScope', '$http', function($rootScope, $http) {

        var geocoder;
        var localPromise;
        var setUserCurrentLocPromise = function(city, country) {
            return new Promise(function(resolve, reject) {
                var user = {};
                user.city = city;
                user.country = country;

                $http.put('/api/setlocation/', user).then(function(data) {
                    resolve();
                }, function(data) {
                    reject();
                });

            });
        };

        function initialize() {
            geocoder = new google.maps.Geocoder();
            localPromise = function(lat, lng) {
                return new Promise(function(resolve, reject) {
                    var city, country;
                    var latlng = new google.maps.LatLng(lat, lng);
                    geocoder.geocode({
                        'latLng': latlng
                    }, function(results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            if (results[1]) {

                                //find city and country name
                                for (var i = 0; i < results[0].address_components.length; i++) {
                                    for (var b = 0; b < results[0].address_components[i].types.length; b++) {

                                        //there are different types that might hold a city admin_area_lvl_1 usually does in come cases looking for sublocality type will be more appropriate
                                        if (results[0].address_components[i].types[b] == "administrative_area_level_2") {
                                            //this is the object you are looking for
                                            city = results[0].address_components[i];
                                        }
                                        if (results[0].address_components[i].types[b] == "country") {
                                            //this is the object you are looking for
                                            country = results[0].address_components[i];
                                        }
                                    }
                                }
                                resolve({
                                    'city': city.long_name.replace("Division", ""),
                                    'country': country.long_name
                                });

                            } else reject("No results found");
                        } else reject("Geocoder failed due to: " + status);
                    });
                });
            };
        }

        function errorFunction() {
            alert("Geocoder failed");
        }

        function successFunction(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            localPromise(lat, lng).then(function(result) {
                return setUserCurrentLocPromise(result.city, result.country);
            }).then(function() {
                console.log('');
            }).catch(function(err) {
                console.log(err);
            });
        }

        initialize();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
        }

    }]);

    main.controller("mainCtrl", ["$scope", "$http", "$rootScope", "$location", "$window", "$route", function($scope, $http, $rootScope, $location, $window, $route) {
        $scope.user = "";
        $scope.suggestion = "";
        $scope.place = null;
        $rootScope.hideit = false;

        $scope.refresh = function() {
            $rootScope.hideit = false;
        };

        $scope.load = function() {
            $http.get('/api/current/').then(function(data) {
                $scope.user = data.data;
            }, function(data) {
                $scope.errorMsg = "Login error: Incorrect password or confirmation code entered. Please try again.";
            });
        };

        $scope.signout = function() {
            $http.delete('/api/signout/').then(function(data) {
                $window.location.reload();
            }, function(data) {
                $scope.errorMsg = "Sign Out error: Something went wrong while logging out";
            });
        };

        $scope.spin = function() {
            var req_location = null;
            var req_term = null;

            if ($scope.place) req_location = $scope.place.formatted_address;
            if ($scope.term) req_term = $scope.term;
            var data = {
                location: req_location,
                term: req_term,
            };

            $http.post('/api/spin/', data).then(function(data) {
                $scope.suggestion = data.data;
                $scope.suggestion.image_url = $scope.suggestion.image_url.replace("/ms.jpg", "/l.jpg");
                $('a[data-text]').each(function() {
                    $(this).attr('data-text', $scope.suggestion.name + " recommended by Stove. Use it & never worry about where to eat");
                });
                twttr.widgets.load();
            }, function(data) {
                $scope.errorMsg = "Spin error: Error occur while getting your request.";
            });
        };

        $scope.fbshare = function() {
            FB.ui({
                method: 'feed',
                link: 'https://mia-stove.herokuapp.com/',
                caption: 'Try new things every new day',
                description: 'I am going try ' + $scope.suggestion.name + "\n" + " recommended by stove. Use stove and never worry about where to eat",
            }, function(response) {
                if (response && !response.error_message) {
                    console.log("Posted on Facebook " + response.post_id);
                } else {
                    console.log('Error occured while posting on facebook');
                }
            });
        };
    }]);

    main.controller('locationCrtl', function($scope, NgMap) {
        $scope.$watch('suggestion', function() {
            if ($scope.suggestion !== "") {
                NgMap.getMap().then(function(map) {
                    google.maps.event.addListener(map, "idle", function() {
                        var center = map.getCenter();
                        google.maps.event.trigger(map, 'resize');
                        map.setCenter(center);
                    });
                });
            }
        });
    });

    main.controller('historyCtrl', function($scope, $http) {
        $scope.user = "";
        $scope.history = [];
        $scope.currentPage = -1;
        $scope.info = {};

        $scope.loadMore = function() {
            $scope.currentPage++;
            $http.get('/api/current/').then(function(data) {
                $scope.user = data.data;
                $http.get('/api/history/' + $scope.user._id + '/' + $scope.currentPage)
                    .then(function(data) {
                        data.data.map(function(item) {
                            $scope.history.push(item);
                        });
                    });
            }, function(data) {
                console.log('No more');
            });
        };
    });

    main.controller("profileCtrl", function($scope, $http, $window, $location, $rootScope) {
        $rootScope.hideit = true;
        $scope.SignUperrorMsg = "";
        $scope.user = "";
        $scope.firstName = "";
        $scope.lastName = "";
        $scope.email = "";
        $scope.city = "";
        $scope.country = "";

        $scope.load = function() {
            $http.get('/api/current/').then(function(data) {
                $scope.user = data.data;
            }, function(data) {
                $scope.errorMsg = "Login error: Incorrect password or confirmation code entered. Please try again.";
            });
        };

        $scope.edit = function() {
            $http.get('/api/current/').then(function(data) {
                var user = data.data;
                if ($scope.firstName.length !== 0 && typeof $scope.firstName !== 'undefined') user.firstName = $scope.firstName;
                if ($scope.lastName.length !== 0 && typeof $scope.lastName !== 'undefined') user.lastName = $scope.lastName;
                if ($scope.email.length !== 0 && typeof $scope.email !== 'undefined') user.email = $scope.email;
                if ($scope.city.length !== 0 && typeof $scope.city !== 'undefined') user.city = $scope.city;
                if ($scope.country.length !== 0 && typeof $scope.country !== 'undefined') user.country = $scope.country;

                $http.put('/api/users/', user).then(function(data) {
                    $window.location.href = "/#!/profile";
                }, function(data) {
                    $scope.SignUperrorMsg = "Update error: " + data.data;
                });
            }, function(data) {
                $scope.errorMsg = "Login error: Incorrect password or confirmation code entered. Please try again.";
            });
        };
    });
})();
