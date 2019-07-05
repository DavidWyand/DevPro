if(!window.location.hash) window.location.hash = "#/";
var isDev = false;
var isIOS = (navigator.userAgent.match(/iPad|iPhone|iPod/g)?true:false);

var app = angular.module('GameDevApp', [
	"ui.router",
	"ui.bootstrap",
	"ngSanitize",
	"sticky"
]);

app.config(function ($stateProvider, $urlRouterProvider, $locationProvider, $anchorScrollProvider) {
	
	$anchorScrollProvider.disableAutoScrolling();
	
	$stateProvider
		.state('home', {
			url: "/",
			views: {
				"@": {
					template: '<div class="pull-left tease course" ng-repeat="(course_id,course) in courses" ng-click="loadCourse(course_id)">'
						+ '	<figure><img ng-if="course.image" class="img-responsive course-image" ng-src="images/{{ course.image }}"></figure>'
						+ '	<h2>{{ course.title }}</h2>'
						+ '	<div class="description" ng-bind-html="course.long_desc"></div>'
						+ '</div>'
				}
			},
			data: {
//				ncyBreadcrumbLabel: ''
			}
		}).state('course', {
			url: "/course/:courseId",
			views: {
				"@": {
					template: '<div id="arc{{arc_id}}_outline" class="arc toc" ng-repeat="(arc_id,arc) in course.arcs" ng-class="{\'focused\':arc_id==devpro.current.arc}">'
						+ '	<figure><img ng-if="arc.image" class="img-responsive course-image" ng-src="images/{{ arc.image }}"></figure>'
						+ '	<h2><small>Arc {{ arc_id+1 }}</small> {{ arc.title }}</h2>'
						+ '	<div class="description" ng-bind="arc.description"></div>'
						+ '	<ul class="modules">'
						+ '		<li class="module" ng-repeat="(module_id,module) in arc.modules"><a ng-click="loadModule(devpro.current.course,arc_id,module_id)" ng-bind="module.title"></a></li>'
						+ '	</ul>'
						+ '</div>'
				}
			},
			data: {
//				ncyBreadcrumbLabel: ''
			}
		}).state('course.arc', {
			url: "/arc/:arcId",
			views: {
				"@": {
					template: '<div id="arc{{arc_id}}_outline" class="arc toc" ng-repeat="(arc_id,arc) in course.arcs" ng-class="{\'focused\':arc_id==devpro.current.arc}">'
						+ '	<figure><img ng-if="arc.image" class="img-responsive course-image" ng-src="images/{{ arc.image }}"></figure>'
						+ '	<h2><small>Arc {{ arc_id+1 }}</small> {{ arc.title }}</h2>'
						+ '	<div class="description" ng-bind="arc.description"></div>'
						+ '	<ul class="modules">'
						+ '		<li class="module" ng-repeat="(module_id,module) in arc.modules"><a ng-click="loadModule(devpro.current.course,arc_id,module_id)" ng-bind="module.title"></a></li>'
						+ '	</ul>'
						+ '</div>'
				}
			},
			data: {
//				ncyBreadcrumbLabel: ''
			}
		}).state('course.arc.module', {
			url: "/module/:moduleId",
			views: {
				"@": {
					template: '<div class="instructions" ng-bind-html="$sce.trustAsHtml(topic.instructions)"></div>'
						+ '<div class="description" ng-bind-html="$sce.trustAsHtml(topic.text)"></div>'
				}
			},
			data: {
//				ncyBreadcrumbLabel: ''
			}
		}).state('course.arc.module.topic', {
			url: "/topic/:topicId?section",
			views: {
				"@": {
					template: '<div class="instructions" ng-bind-html="topic.instructions"></div>'
						+ '<div ui-player></div>'
						+ '<div class="description" ng-bind-html="topic.text"></div>'
				}
			},
			data: {
//				ncyBreadcrumbLabel: ''
			}
		}).state('glossary', {
			url: "/glossary?section",
			views: {
				"@": {
					template: "<div class='alphabet'>"
						+ "  <ul class='alphabet_nav' sticky sticky-class='stuck'>"
						+ "    <li ng-repeat='(key, letter) in letters'><a ng-click='goto(key)'>{{key}}</a></li>"
						+ "  </ul>"
						+ "  <div ng-repeat='(key, letter) in letters' class='accent'>"
						+ "    <a class='letter-anchor' id='{{key}}'></a>"
						+ "    <h4>{{key}}</h4>"
						+ "    <dl class='definitions'>"
						+ "      <dt class='modglossary definGroup' ng-repeat-start='entry in letter | orderBy:\"word\"' ng-bind='entry.word'></dt>"
						+ "      <dd ng-repeat-end ng-bind='entry.definition'></dd>"
						+ "    </dl>"
						+ "  </div>"
						+ "</div>"
				}
			},
			data: {
//				ncyBreadcrumbLabel: ''
			}
		}).state('index', {
			url: "/index?section",
			views: {
				"@": {
					template: "<div class='alphabet'>"
						+ "  <ul class='alphabet_nav' sticky sticky-class='stuck'>"
						+ "    <li ng-repeat='(key, letter) in letters track by $index'><a ng-click='goto(key)'>{{key}}</a></li>"
						+ "  </ul>"
						+ "  <div ng-repeat='(key, letter) in letters track by $index' class='accent'>"
						+ "    <a class='letter-anchor' id='{{key}}'></a>"
						+ "    <h4>{{key}}</h4>"
						+ "    <dl class='definitions'>"
						+ "      <dt ng-repeat-start='entry in letter | orderBy:\"word\"' ng-bind='entry.word'></dt>"
						+ "      <dd ng-repeat-end><ul>"
						+ "         <li ng-repeat='location in entry.locations'>"
						+ "           <a class='indexLink' ng-click='loadReferenceSection(location.courseId,location.arcId,location.moduleId,location.sectionId)' ng-bind='location.title'></a>"
						+ "         </li>"
						+ "      </ul></dd>"
						+ "    </div>"
						+ "  </div>"
						+ "</div>"
				}
			},
			data: {
//				ncyBreadcrumbLabel: ''
			}
		});
		
		
});


app.run(function($rootScope, $window, $location, $state, $sce, $interval, $timeout, $log, $anchorScroll) {
	
	$rootScope.forceReload = false; // for ios
	$rootScope.userAgent = navigator.userAgent;
	$rootScope.isMobile = (/iPhone|iPod|iPad|Android|BlackBerry/).test($rootScope.userAgent);
	if(typeof $window.isDemo === "undefined") {
		$window.isDemo = false;
	} $rootScope.isDemo = $window.isDemo;
	$rootScope.isHosted = $location.protocol()!=="file"&&!$rootScope.isDemo;
	
	if(isDev) $log.debug('app.run','| mobile:',$rootScope.isMobile,'| demo:',$rootScope.isDemo,'| hosted:',$rootScope.isHosted);
	
	$rootScope.launchExercise = function (path, e) {
		if ($rootScope.isDemo !== false) {
			e.preventDefault();
			$('#myModal').appendTo('body').modal('show');
			return false;
		}
		return true;
	};
	
	$rootScope.running = true;
	
});

app.directive('exerciseContent', function ($compile, $sce) {
	return {
		restrict: 'C',
		replace: true,
		link: function (scope, elem, attrs) {
			scope.$watch(attrs.instr, function (instructions) {
				elem.html($sce.trustAsHtml(instructions));
				$compile(elem.contents())(scope);
			});
		}
	};
});

app.directive('referenceContent', function ($compile, $sce) {
	return {
		restrict: 'C',
		replace: true,
		link: function (scope, elem, attrs) {
			scope.$watch(attrs.reefer, function (text) {
				elem.html($sce.trustAsHtml(text));
				$compile(elem.contents())(scope);
			});
		}
	};
});

app.directive('simPopup', function () {
	return {
		restrict: 'C',
		link: function (scope, elem, attrs) {
			var simHref = attrs.href;
			elem.bind('click', function (evt) {
				evt.preventDefault();
				window.open(simHref, 'simWin', "height=720, width=1280, menubar=no, location=no, status=no, toolbar=no");
			});
		}
	};
});

app.directive('ankor', function ($uiViewScroll) {
	return {
		restrict: 'C',
		link: function (scope, elem, attrs) {
			var ankorHref = attrs.href;
			elem.bind('click', function (evt) {
				evt.preventDefault();
				$uiViewScroll(angular.element(document.querySelector(ankorHref)));
			});
		}
	};
});

app.directive('anchorJump', function () {
	return {
		restrict: 'C',
		link: function (scope, elem, attrs) {
		}
	};
});

app.directive('dest', function ($stateParams, $uiViewScroll) {
	return {
		restrict: 'C',
		link: function (scope, elem, attrs) {
			if ($stateParams.scrollTo) {
				if ($stateParams.scrollTo === attrs.id) {
					$uiViewScroll(elem);
				}
			}
		}
	};
});

app.directive('ngMin', function() {
  return {
    restrict : 'A',
    require : ['ngModel'],
    compile: function($element, $attr) {
      return function linkDateTimeSelect(scope, element, attrs, controllers) {
        var ngModelController = controllers[0];
        scope.$watch($attr.ngMin, function watchNgMin(value) {
          element.attr('min', value);
          ngModelController.$render();
        })
      }
    }
  }
});

app.directive('ngMax', function() {
  return {
    restrict : 'A',
    require : ['ngModel'],
    compile: function($element, $attr) {
      return function linkDateTimeSelect(scope, element, attrs, controllers) {
        var ngModelController = controllers[0];
        scope.$watch($attr.ngMax, function watchNgMax(value) {
          element.attr('max', value);
          ngModelController.$render();
        })
      }
    }
  }
});

app.directive('uiPlayer', function($sce,$log) {
	
	var videoId = Math.floor((Math.random() * 1000) + 100);
	if(isDev) $log.warn('running uiplayer for #video-'+videoId);
	
	return {
		template: '<figure id="player" class="unselectable" ng-class="{\'fullscreen\':devpro.video.fullscreen}">'
			+ '	<video ng-src="{{devpro.video.source}}" id="video-'+videoId+'" width="auto" height="auto" class="video-js vjs-devpro-skin" ng-class="{\'fullscreen\': devpro.video.fullscreen }" preload="auto" controls>'
			+ '		<source src="{{devpro.video.source}}">'
			+ '		<source src="{{devpro.video.source}}" type="video/mp4">'
			+ '	</video>'
//			+ ' <ul class="extra_controls">'
//			+ '   <li class="preferences">'
//			+ '     <label class="checkbox">'
//			+ '       <a ng-click="devpro.video.autoplay = !devpro.video.autoplay" ng-class="{\'inactive\':!devpro.video.autoplay}"><i class="glyphicon" ng-class="{\'glyphicon-unchecked\':!devpro.video.autoplay, \'glyphicon-check\':devpro.video.autoplay}"></i> autoplay videos</a>'
//			+ '     </label>'
//			+ '   </li>'
//			+ ' </ul>'
			+ '	<div id="popcorn" class="quizmaster_overlay"></div>'
			+ '	<div id="popcorn_results" class="quizmaster_overlay results" ng-class="{\'active\':devpro.video.show_results}">'
			+ '		<form class="quiz active">'
			+ '			<h1 class="question">Your Results</h1>'
			+ '			<fieldset class="choices">'
			+ '				<label class="result" ng-repeat="(key,result) in devpro.video.results">'
			+ '					<span class="result_key">Question {{ key+1 }}:</span> <b class="result_score">{{ result.attempts }} attempt<span ng-show="result.attempts>1">s</span></b>'
			+ '				</label>'
			+ '			</fieldset>'
			+ '			<ul class="indicator">'
			+ '				<li ng-repeat="result in devpro.video.results" class="success"></li>'
			+ '			</ul>'
			+ '			<fieldset class="controls">'
			+ '				<button type="button" ng-click="devpro.video.reset(true)">Replay Video <span class="glyphicon glyphicon-refresh"></span></button>'
			+ '				<button ng-if="devpro.next.topic" type="button" ng-click="nextTopic()"><span ng-bind="devpro.next.topic_label"></span><span class="glyphicon glyphicon-fast-forward"></span></button>'
			+ '			</fieldset>'
			+ '		</form>'
			+ '	</div>'
			+ '</figure>',
		restrict: "A",
		scope: false,
		replace: true,
		link: function(scope,elem,attrs) {
			
			var video = scope.devpro.video;
			var autoplay = video.autoplay;
			if(isDev) $log.info("resetting #video-"+videoId,autoplay);
			video.speed_restore = video.speed;
			if(scope.topic.movie.length > 1) {
				
				if(isDev) $log.log("movie url",scope.topic.movie);
				video.source = $sce.trustAsResourceUrl(scope.topic.movie+"?t="+videoId);
				video.type = "video/mp4";
				if(isDev) $log.log("poster url",scope.topic.poster);
				video.poster = $sce.trustAsResourceUrl(scope.topic.poster+"?t="+videoId);
				if(isIOS) scope.$apply(); // Fixed the $scope.apply() video bug for mobile browsers. [GDC-1019]
				if(video.vjs) video.vjs.dispose();

				if(video.source) {
					
					video.player = document.getElementById("video-"+videoId);
					video.vjs = videojs('video-' + videoId, {
						
						playbackRates: [1,1.5,2],
						autoplay: autoplay
						
					}).ready(function() {
						
						if(isDev) $log.info("finished activating videojs...");
						
						this.on("durationchange", function(e) {
							video.position = 0;
							video.duration = video.vjs.duration();
							video.loading = true;
							video.checkTime = true;
							video.vjs.loadingSpinner.show();
							if(isDev) $log.debug("duration of video changed to",video.duration);
							if(isDev) $log.debug("resetting playbackRate to last known speed: ",video.speed_restore);
							this.playbackRate(video.speed_restore);
							if(isDev) $log.debug("resetting volume to last known level: ",video.volume_restore);
							this.volume(video.volume_restore);
							video.vjs.loadingSpinner.hide();
							video.checkTime = false;
							video.loading = false;
							//scope.$apply();
						});
						
						this.on("timeupdate", function(e) {
							
							if(video.checkTime&&video.vjs.currentTime()!==video.position) {
								if(isDev) $log.info('video done loading so hiding the spinner');
								video.vjs.loadingSpinner.hide();
								video.checkTime = false;
								video.loading = false;
							}
							
							video.position = video.vjs.currentTime();
							
							if(video.speed !== video.vjs.playbackRate()) {
								video.speed = video.vjs.playbackRate();
								video.pop.playbackRate(video.speed);
								if(isDev) $log.warn("devpro.video speed changed:",video.speed);
							}
							
							if(video.fullscreen !== video.vjs.isFullscreen()) {
								video.fullscreen = video.vjs.isFullscreen();
								$log.warn("devpro.video fullscreen changed:",video.fullscreen);
							}
							
						});
						
						this.on("fullscreenchange ", function() {
							video.fullscreen = video.vjs.isFullscreen();
							if(isDev) $log.warn('changed fullscreen to ',video.fullscreen);
						});
						
						this.on("ended", function() {
							if(isDev) $log.info('video finished playing');
							video.ended();
						});
						
						this.on("pause", function() {
							video.pop.pause();
						});
						
						this.on("play", function() { 
							video.pop.play();
						});
						
						this.on("seeking", function() {
							if(!video.loading) {
								if(isDev) $log.info('show the spinner');
								video.loading = true;
								video.vjs.loadingSpinner.show();
							}
						});
						
						this.on("seeked", function() {
							if(!video.checkTime) {
								if(isDev) $log.info('done seeking so now listen for change in time to let us know it has loaded and is playing');
								video.checkTime = true;
							}
						});
						
						this.on("volumechange", function() {
							video.volume_restore = this.volume();
							if(isDev) $log.info('adjusted volume to this level: ', video.volume_restore);
						});
						
						if(isDev) $log.warn("prompts to pass to popcorn",scope.topic.prompts);
						video.pop = Popcorn("#video-"+videoId+"_html5_api",{frameAnimation:true}).quizmaster({
							api: scope.devpro,
							debug: isDev,
							controls: false,
							container_id: "popcorn",
							video_id: "video-"+videoId+"_html5_api",
							allow_wrong_answers: false,
							hint_delay: 6,
							prompts: scope.topic.prompts,
							autoplay: video.autoplay
						});

						video.quizmaster = video.pop.data.running.quizmaster[0];
						if(isDev) $log.info("enabled quizmaster",video.quizmaster,"autoplay: ",autoplay);				
						
					});

				} else {
					
					if(isDev) $log.warn("no video sources");
					video.source = false;
					video.sources = false;
					
				}
				
				scope.devpro.enableInputs();
				
			}
			
		}
	}
	
});