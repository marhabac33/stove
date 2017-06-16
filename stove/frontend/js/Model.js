var stove = (function() {
    "use strcit";

    var stove = angular.module("stove", []);

    stove.controller("signCtrl", function($scope, $http, $window, $location) {
        $scope.email = "";
        $scope.password = "";
        $scope.errorMsg = "";
        $scope.result = "";

        $scope.login = function() {
            if ($scope.email !== "" && $scope.password !== "") {
                var data = {
                    email: $scope.email,
                    password: $scope.password
                };

                $http.post('/api/signin/', data).then(function(data) {
                    $window.location.href = "/";
                }, function(data) {
                    $scope.errorMsg = "Login error: Incorrect password or confirmation code entered. Please try again.";
                });
            }
        };

        $scope.loginFB = function() {
            FB.login(function(response) {
                if (response.authResponse) {
                    FB.api("/me", "GET", {
                        fields: "email, first_name, last_name, id, picture"
                    }, function(result) {
                        result.type = 'FB';
                        $http.post('/api/signinFB/', result).then(function(data) {
                            $window.location.href = "/";
                            $scope.result = data.data.email;
                        }, function(data) {
                            $scope.errorMsg = "Login error";
                        });
                    });
                } else {
                    $scope.errorMsg = "Facebook Login error: Could not retrieve facebook authentication.";
                }

            }, {
                scope: 'email',
                return_scope: true
            });
        };
    });


    stove.controller("signUpCtrl", function($scope, $http, $window, $location) {
        $scope.SignUperrorMsg = "";

        $scope.signup = function() {
            if ($scope.email !== "" && $scope.password !== "") {
                var data = {
                    firstName: $scope.firstName,
                    lastName: $scope.lastName,
                    email: $scope.email_id,
                    city: $scope.city,
                    country: $scope.country,
                    password: $scope.password,
                    type: 'user'
                };

                $http.post('/api/users/', data).then(function(data) {
                    $window.location.href = "/";
                }, function(data) {
                    $scope.SignUperrorMsg = "Sign Up error: " + data.data;
                });
            }
        };
    });
    // return stove;
})();
