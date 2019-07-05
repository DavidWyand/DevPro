app.controller('IndexController', function($rootScope, $scope, $state, $location, $stateParams) {

  $scope.siteIndex = index;
  $scope.newIndex = [];
  console.log($scope.newIndex);
  var getIndexOfObjWithOwnAttr = function(array, attr, value) {
  	for(var i; i<array.length; i++) {
  		if(array[i].hasOwnProperty(attr) && array[i][attr] === value) {
  			return i;
  		}
  	}
  	return -1;
  }

  angular.forEach($scope.siteIndex, function(value, key) {
  	var newIndexItem = {};
  	newIndexItem.word = value.word;
  	newIndexItem.locations = [];
  	angular.forEach(value.locations, function(value, key) {
  		var locationObj = {};
  		locationObj.course = value.course;
  		locationObj.arc = value.arc;
  		locationObj.module = value.module;
  		locationObj.topic = value.topic;
  		locationObj.url = value.url;

  		for (var courseId = 0; courseId < $rootScope.courses.length; courseId++)
  		{
  		    var course = $rootScope.courses[courseId];
  		    if (course.title == locationObj.course)
  		    {
  		        locationObj.courseId = courseId;
  		        for (var arcId = 0; arcId < course.arcs.length; arcId++)
  		        {
  		            var arc = course.arcs[arcId];
  		            if (arc.title == locationObj.arc)
  		            {
  		                locationObj.arcId = arcId;
  		                for (var moduleId = 0; moduleId < arc.modules.length; moduleId++)
  		                {
  		                    var module = arc.modules[moduleId];
  		                    if (module.name == locationObj.module)
  		                    {
  		                        locationObj.modId = moduleId;
  		                        for (var topicId = 0; topicId < module.topics.length; topicId++)
  		                        {
  		                            var topic = module.topics[topicId];
  		                            if (topic.name == "Reference")
  		                            {
  		                                locationObj.topicEndId = topicId;
  		                                break;
  		                            }
  		                        }
  		                        break;
  		                    }
  		                }
  		                break;
  		            }
  		        }
  		        break;
  		    }
  		}
  		newIndexItem.locations.push(locationObj);
  	});  	
  	$scope.newIndex.push(newIndexItem);
  });


  $scope.jumpTo = function(course, arc, mod, topic, anchor) {
    var urlAnchor = anchor.substring(1);
    $state.go('courses.course.arc.modules.topic', {courseId: course, arcId: arc, modId: mod, topicId: topic, scrollTo: urlAnchor});
    console.log('heehaw');
  };
});