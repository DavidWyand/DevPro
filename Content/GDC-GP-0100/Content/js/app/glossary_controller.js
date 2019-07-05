app.controller('GlossaryController', function($rootScope, $scope, $state, $location, $stateParams, $uiViewScroll) {

	$scope.letters = {};
	var alphabet = "abcdefghijklmnopqrstuvwxyz";

	$scope.fullGlossary = all_glossary;
	
	angular.forEach($scope.fullGlossary, function(value, index) {
	  var currentWord = value;
	  var wordLetter = value.word.substring(0,1).toUpperCase();
	  if(!(wordLetter in $scope.letters)) {
		$scope.letters[wordLetter] = [];
	  }
	  for (var property in $scope.letters) {
		if($scope.letters.hasOwnProperty(property)) {
		  if (wordLetter === property) {
			$scope.letters[wordLetter].push(currentWord);
		  }
		}
	  }
	});
	
	$scope.scrollIt = function(letter) {
	  $uiViewScroll(angular.element(document.querySelector("#"+letter)));
	};
	
});
