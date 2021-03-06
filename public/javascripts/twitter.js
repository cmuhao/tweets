/**
 * Created by hao on 7/8/17.
 * the module and controller of the frontend client.
 */
(function () {

    var tweets = angular.module('tweets', ['ngRoute','ngResource']);

    tweets.factory("tweetResource", ['$resource', function ($resource) {
        return {
            tweet: $resource('/api/tweets', {}, {
                getTweets: {method: 'GET', isArray: true}
            }),
            summarizer: $resource('/api/summarizer', {}, {
                lexrank: {method: 'GET', isArray: true}

            }),
            getKeyWords: $resource('/api/getKeywords', {}, {
                tfidf: {method: 'GET', isArray: true}
            }),
            cluster: $resource('/api/clustering', {}, {
                clustering: {method: 'GET', isArray: false}
            }),
            word2vec: $resource('/api/word2vec', {}, {
                getVec: {method: 'GET', isArray: false}
            })
        };
    }]);

    var getTweets = angular.module('getTweets', ['tweets','ngMaterial', 'chart.js']);

    getTweets.config(['$httpProvider', 'ChartJsProvider', function($httpProvider, ChartJsProvider) {
        $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
        // Configure all charts
        ChartJsProvider.setOptions({
            chartColors: ['#FF5252'],
            responsive: false
        });
        // Configure all line charts
        ChartJsProvider.setOptions('line', {
            showLines: false
        });
    }]);

    getTweets.controller("twitterController",  ["$scope", "tweetResource", "$window", "$element", "$mdDialog",
    function ($scope, tweetResource, $window, $element, $mdDialog) {

        /**
         * user's tweets
         * @type {Array}
         */
        $scope.tweets = [];
        /**
         * username
         * @type {string}
         */
        $scope.username = "";
        /**
         * representative tweets
         * @type {Array}
         */
        $scope.reps = [];
        /**
         * tweet clusters
         */
        $scope.clusters = {};
        /**
         * tweet key words
         * @type {Array}
         */
        $scope.words = [];
        /**
         * chart-label
         * @type {Array}
         */
        $scope.labels = [];
        /**
         * chart data
         * @type {Array}
         */
        $scope.data = [];
        /**
         * chart-series
         * @type {[*]}
         */
        $scope.series = ['weight'];

        $scope.$watch('username', function (value) {
            $scope.username = value;
        });

        $scope.click = function ($event) {
            //getTweets(getReps, getWords);
            getTweets(getVec, getWords);

            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('What\'s next!')
                    .textContent('It might take 15 seconds to do the analysis.' +
                        ' You can scroll page down to see the result.')
                    .ariaLabel('Alert Dialog Demo')
                    .ok('Got it!')
                    .targetEvent($event)
            );
        };

        /**
         * get all tweets of a user
         * @param callback1
         * @param callback2
         */
        function getTweets(callback1, callback2) {
            tweetResource.tweet.getTweets({name: $scope.username}, function (data) {
                $scope.tweets = data;
                $scope.search = true;
                callback1();
                callback2();
            }, function (error) {
                console.alert(error);
            });

        }

        function getVec() {
            tweetResource.summarizer.lexrank({text: $scope.tweets}, function (data) {
                $scope.reps = data;
                $scope.data = [];
                $scope.labels = [];
                data.forEach(function (rep) {
                    $scope.data.push(rep.weight);
                    $scope.labels.push(rep.index + 1);
                });

            }, tweetResource.word2vec.getVec({text: $scope.tweets, name: $scope.username}, function(data) {
                console.log(data);
                $scope.clusters = data;

            }), function (error) {
                console.alert(error);
            });
        }

        /**
         * get representative tweets of a user's tweets
         */
        function getReps() {
            tweetResource.summarizer.lexrank({text: $scope.tweets}, function (data) {
                $scope.reps = data;
                $scope.data = [];
                $scope.labels = [];
                data.forEach(function (rep) {
                    $scope.data.push(rep.weight);
                    $scope.labels.push(rep.index + 1);
                });

            }, tweetResource.cluster.clustering({text: $scope.tweets}, function(data) {
                $scope.clusters = data;

            }), function (error) {
                console.alert(error);
            });
        }

        /**
         * get key words of a user's tweets
         */
        function getWords() {

            tweetResource.getKeyWords.tfidf({name: $scope.username, text: $scope.tweets}, function (data) {
                $scope.words = data;

                document.getElementById("cloud").innerHTML = "";
                d3.wordcloud()
                    .size([900, 500])
                    .selector('#cloud')
                    .words($scope.words)
                    .start();

            }, function (error) {
                console.alert(error);
            });
        }

        console.log($scope);
    }]);

})();