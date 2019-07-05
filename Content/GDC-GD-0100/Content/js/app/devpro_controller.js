app.controller("DevProController", function($rootScope, $scope, $window, $location, $state, $sce, $interval, $timeout, $log, $anchorScroll, analytics) {

	if(isDev) $log.info("DevProController loading");
	
	$scope.devpro = {
		enableInputs: function() {
			if(isDev) $log.warn("assigning keyboard commands to devpro");
			// keyboard controls
			$window.onkeypress = function() {
				var keyCode = ('charCode' in event) ? event.charCode : event.keyCode;
				if(isDev) $log.warn('pressed key',keyCode);
				switch(keyCode) {
					case 13: // enter key
						console.log('gotcha');
						$scope.devpro.video.toggle("results");
						break;
					case 32: // spacebar 
						$scope.devpro.video.toggle("pause");
						break;
					case 45: // minus sign 
						$scope.devpro.playlist_active = false;
						$scope.$apply();
						break;
					case 43: // plus sign 
						$scope.devpro.playlist_active = true;
						$scope.$apply();
						break;
					case 61: // other plus sign 
						$scope.devpro.playlist_active = true;
						$scope.$apply();
						break;
					case 46: // <---
						$scope.nextTopic();
						break;
					case 44: // ---> 
						$scope.prevTopic();
						break;
					case 120: // spacebar 
						$scope.devpro.video.toggle("speed");
						break;
					default:
						break;
				}
			};
		},
		disableInputs: function() {
			if(isDev) $log.warn("removing keyboard commands from devpro");
			// keyboard controls
			//$window.onkeypress = null;
		},
		nav_collapse: true,
		year: new Date().getFullYear(),
		show_results: function() { if(isDev) $log.info("showing results"); // the results screen
			var video = $scope.devpro.video;
			video.show_results = true;
			$scope.$apply();
		},
		video: {
			
			directory: "./video/",
			sfx_directory: "./sfx/",
			poster: false,
			source: "",
			player: false, // video element
			vjs: false, // videojs controller
			pop: false, // popcorn controller
			quizmaster: false, // quizmaster controller
			paused: true,
			speed: 1,
			speed_restore: 1,
			autoplay: false,
			fullscreen: false,
			duration: null,
			position: null,
			volume: 1,
			volume_restore: 1,
			muted: false,
			results: [],
			show_results: false,
			checkTime: false, // used to check if time has changed (helps to hide loading icon after scrub)
			loading: false,
			
			// quizmaster sends results here to sync up
			updateResults: function(results) {
				$scope.devpro.video.results = results;
			},
			
			// change the volume
			setVolume: function(new_level) {
				var video = $scope.devpro.video;
				video.volume = new_level;
				video.toggle("volume");
			},
			
			// runs when one of the toggles is clicked (believe this is unused after adding videojs player)
			toggle: function(button) { if(isDev) $log.info("toggle button clicked",button);
				var video = $scope.devpro.video;
				
				switch(button) {
					
					case "seek": // seek bar toggled
						if(isDev) $log.debug("seek to ",video.position);
						video.vjs.currentTime(video.position);
						break;
					
					case "volume": // volume bar toggled
						if(isDev) $log.debug("set volume to ",video.volume);
						video.vjs.volume(video.volume);
						video.volume_restore = video.volume;
						video.muted = video.volume===0;
						video.vjs.muted(video.muted);
						break;
					
					case "pause": // play or pause the video
						var ispaused = video.vjs.paused();
						if(ispaused) { 
							if(isDev) $log.debug('playing video');
							video.vjs.playbackRate(video.speed);
							video.pop.playbackRate(video.speed);
							video.vjs.play();
						}
						else { if(isDev) $log.debug('pausing video'); video.vjs.pause(); }
						video.paused = !ispaused;
						if(isDev) $log.debug("resulted in this state: ",video.paused);
						break;
						
					case "speed": // double playback rate (or switch it back to normal)
						switch(video.speed) {
							case 1:
								video.speed = 1.5;
								break;
							case 1.5:
								video.speed = 2;
								break;
							default:
								video.speed = 1;
						}
						video.vjs.playbackRate(video.speed);
						video.pop.playbackRate(video.speed);
						video.speeding = video.speed!==1;
						//$scope.$apply();
						if(isDev) $log.debug("resulted in this state: ",video.speed);
						break;
						
					case "mute": // mute (or unmute) the video
						var ismuted = video.vjs.muted();
						if(ismuted) {
							video.volume = video.volume_restore;
							video.vjs.muted(false);
						} else {
							video.volume_restore = video.volume;
							video.volume = 0;
							video.vjs.muted(true);
						}
						
						video.muted = !ismuted;
						if(isDev) $log.debug("resulted in this state: ",video.muted);
						break;
						
					case "fullscreen": // make things fullscreen
						var isfullscreen = video.fullscreen;
						if(!isfullscreen) { // request it
							video.vjs.requestFullscreen();
						} else { // leave it
							video.vjs.exitFullscreen();
						}
						break;
					
					default:
						if(isDev) $log.debug("that toggle does not exist");
				}
				
			},
			
			// the full reset moved to the uiPlayer directive
			// this is now a glorified rewind and start over function
			reset: function(autoplay) { 
				var video = $scope.devpro.video;
				video.vjs.currentTime(0);
				video.position = null;
				video.show_results = false;
				if(autoplay) video.vjs.play();
			},
			
			// the results screen
			ended: function() { if(isDev) $log.info("video finished playing");
				var video = $scope.devpro.video;
				video.quizmaster._natives.final_countdown(); // dahh-dahh-dohh-dohhhhhhhh... dahh-dahh-doh-doh-dohhhh
			},
			
			// remove the video player and destroy popcorn overlay
			kill: function() { if(isDev) $log.info("killing video");
				var video = $scope.devpro.video;
				video.poster = false;
				video.source = "";
				if(video.vjs) {
					video.vjs.dispose();
					video.vjs = false;
					if(isDev) $log.debug('videojs disposed of',video.vjs);
				}
				if(video.pop) {
					Popcorn.destroy(video.pop);
					video.pop = false;
					if(isDev) $log.debug('popcorn destroyed',video.pop);
				}
				
				// reset some of the tracking values
				// so video controls don't get weird
				// leave playback speed, volume, and muted alone
				video.paused = true;
				video.duration = null;
				video.position = null;
				video.results = [];
				video.show_results = false;
				
			},
			
			// runs when video is done playing
			// show next step (link to next video in playlist or reference)
			done: function() { if(isDev) $log.info("video finished");
				var video = $scope.devpro.video;
				if(video.vjs) video.vjs.stop();
				video.next_up = {
					//
				};
			},
		},
		title: "Available Courses",
		screen: "home",
		playlist_active: false,
		current: {},
		back: {},
		crumbs: []
	};
	
	if(isDev) $log.info("devpro object initialized");
	if(isDev) $log.debug("devpro",$scope.devpro);

	// process json courses	
	$scope.courses = GlobalCourseData.courses;
	
	angular.forEach($scope.courses,function(course,course_id) {
		course.nav_collapse = true;
		angular.forEach(course.arcs,function(arc,arc_id) {
			arc.nav_collapse = true;
			angular.forEach(arc.modules,function(module,module_id) {
				module.reference_key = module.topics.length-2;
				module.buttons = [];
				module.playlist = [];
				module.nav_collapse = true;
				angular.forEach(module.topics,function(topic,topic_id) {
					topic.nav_collapse = true;
					if(topic.name==="Reference") { module.reference_key = topic_id; }
					if(topic.movie) {
						module.playlist.push(topic_id);
						topic.movie = topic.movie.replace("./video/",$scope.devpro.video.directory);
						topic.poster = topic.movie+".png";
						topic.thumb = topic.movie+"_thumb.png";
						if(!topic.hasOwnProperty("prompts")) topic.prompts = false;
					} else {
						module.buttons.push(topic_id);
						topic.poster = false;
						topic.thumb = false;
					}
					if(topic.instructions) topic.instructions = $sce.trustAsHtml(topic.instructions);
					if(topic.text) topic.text = $sce.trustAsHtml(topic.text.replace(/href="#(.*?)"/g,'href="#/course/'+course_id+'/arc/'+arc_id+'/module/'+module_id+'/topic/'+topic_id+'?section=$1"'));
				});
			});
		});
	});
	
	if(isDev) $log.info("processed course content");
	if(isDev) $log.debug("courses",$scope.courses);

	$scope.$on("$stateChangeStart", function (ev, toState, toParams, fromState, fromParams) {
		if(isDev) $log.warn("State Change: (start) - ", "from:", fromState.name, "to:", toState.name);
	});

	$scope.$on("$stateChangeSuccess", function (ev, toState, toParams, fromState, fromParams) {
		
		if($rootScope.forceReload) {
			
			if(isDev) $log.warn("about to trigger a refresh to clean it up for ios");
	
			$timeout(function() {
				//window.location.reload(true);
				$state.reload();
				if(isDev) $log.warn("...triggered!");
			},2000,true);
		
		}
		
		var stateSplit = toState.name.split(".");
		var screen = stateSplit[stateSplit.length-1];
		var hit_path = "/";
		var hit_title = "";
		var hit_course = "";
		var scroll_target = null;
		
		if(isDev) $log.warn("State Change: (success) -", "from:", fromState.name, "to:", toState.name,"params:",toParams);
		
		$scope.course = null;
		$scope.arc = null;
		$scope.module = null;
		$scope.topic = null;
		$scope.devpro.title_id = null;
		$scope.devpro.crumbs = null;
		$scope.devpro.video.kill();
		$scope.devpro.prev = {
			arc:false,
			module:false,
			topic:false,
			topic_label:false
		};
		$scope.devpro.next = {
			arc:false,
			module:false,
			topic:false,
			topic_label:false
		};		
		
		// store the last known video on the playlist for safekeeping
		var last_playlist = $scope.devpro.back.hasOwnProperty("playlist") ? $scope.devpro.back.playlist : 0;
		
		$scope.devpro.back = {
			arc:fromParams.arcId,
			module:fromParams.moduleId,
			playlist_active: $scope.devpro.playlist_active
		};
		
		$scope.letters = {};
		
		switch(screen) {
		
			case "home":
				$scope.devpro.title = "Available Courses";
				if(isDev) $log.info("loaded home screen");
				break;
				
			case "course":
				$scope.course = $scope.courses[toParams.courseId];
				$scope.devpro.title = $scope.course.title +" Lesson Plan";
				hit_path += "course/"+toParams.courseId;
				hit_title = $scope.devpro.title;
				hit_course = $scope.course.title;
				if(isDev) $log.debug("loaded course screen",$scope.course);
				break;
				
			case "arc":
				$scope.course = $scope.courses[toParams.courseId];
				$scope.arc = $scope.course.arcs[toParams.arcId];
				$scope.devpro.title = $scope.course.title +" Lesson Plan";
				$scope.devpro.prev.arc = parseInt(toParams.arcId)!==0 ? parseInt(toParams.arcId)-1 : false;
				$scope.devpro.next.arc = parseInt(toParams.arcId)!==$scope.course.arcs.length-1 ? parseInt(toParams.arcId)+1 : false;
				hit_path += "course/"+toParams.courseId+"/arc/"+toParams.arcId;
				hit_title = $scope.devpro.title+" Arc Overview";
				hit_course = $scope.course.title;
				scroll_target = "arc"+toParams.arcId+"_outline";
				if(isDev) $log.debug("loaded arc screen",$scope.arc);
				$scope.devpro.crumbs = [
					{ title: $scope.course.title, href: "#/course/"+toParams.courseId, class:'tablet' }
				];
				break;
				
			case "topic":
				$scope.course = $scope.courses[toParams.courseId];
				$scope.arc = $scope.course.arcs[toParams.arcId];
				$scope.module = $scope.arc.modules[toParams.moduleId];
				$scope.topic = $scope.module.topics[toParams.topicId];
				
				// set the last playlist video 
				$scope.devpro.back.playlist = !$scope.topic.movie ? last_playlist : toParams.topicId;
				if(!$scope.topic.movie) $scope.devpro.playlist_active = false;
				
				$scope.devpro.title = $scope.module.title;
				$scope.devpro.crumbs = [
					{ title: $scope.course.title, href: "#/course/"+toParams.courseId, class:'tablet' },
					{ title: $scope.arc.title, href: "#/course/"+toParams.courseId+"/arc/"+toParams.arcId }
				];
				if(isDev) $log.info("prettifying code");
				setTimeout(prettyPrint, 1);
				$scope.devpro.prev.module = parseInt(toParams.moduleId)!==0 ? parseInt(toParams.moduleId)-1 : false;
				$scope.devpro.next.module = parseInt(toParams.moduleId)!==$scope.arc.modules.length-1 ? parseInt(toParams.moduleId)+1 : false;
				$scope.devpro.prev.topic = parseInt(toParams.topicId)!==0 ? parseInt(toParams.topicId)-1 : false;
				if($scope.devpro.prev.topic) {
					$scope.devpro.prev.topic_label = $scope.module.topics[$scope.devpro.prev.topic].movie ? "Previous Video" : $scope.module.topics[$scope.devpro.prev.topic].title;
				} else $scope.devpro.prev.topic_label = false;
				$scope.devpro.next.topic = parseInt(toParams.topicId)!==$scope.module.topics.length-1 ? parseInt(toParams.topicId)+1 : false;
				if($scope.devpro.next.topic) {
					$scope.devpro.next.topic_label = $scope.module.topics[$scope.devpro.next.topic].movie ? "Next Video" : $scope.module.topics[$scope.devpro.next.topic].title;
				} else $scope.devpro.next.topic_label = false;
				hit_path += "course/"+toParams.courseId+"/arc/"+toParams.arcId+"/module/"+toParams.moduleId+"/topic/"+toParams.topicId;
				hit_title = $scope.arc.title+" > "+$scope.module.title+": "+$scope.topic.name;
				hit_course = $scope.course.title;
				if(isDev) $log.debug("loaded topic screen",$scope.topic);
				break;
				
			case "glossary":
				$scope.devpro.title = "Glossary of Terms";
				var alphabet = "abcdefghijklmnopqrstuvwxyz";
				$scope.fullGlossary = all_glossary;
				if(isDev) $log.info('glossary obj',$scope.fullGlossary);
				angular.forEach($scope.fullGlossary, function(value, index) {
					var currentWord = value;
					var wordLetter = value.word.substring(0,1).toUpperCase();
					if(!(wordLetter in $scope.letters)) { $scope.letters[wordLetter] = []; }
					for(var property in $scope.letters) {
						if($scope.letters.hasOwnProperty(property)) {
							if(wordLetter === property) {
								$scope.letters[wordLetter].push(currentWord);
							}
						}
					}
				});
				$scope.goto = function(key) {
					var e = document.getElementById(key);
					if (!!e && e.scrollIntoView) {
						e.scrollIntoView();
					}
				};
				hit_path += "glossary";
				hit_title = "Glossary of Terms";
				break;
				
			case "index":
				$scope.devpro.title = "Site Index";
				var alphabet = "abcdefghijklmnopqrstuvwxyz";
				$scope.siteIndex = index;
				if(isDev) $log.info('site index obj',$scope.siteIndex);
				angular.forEach($scope.siteIndex, function(value,index) {
					var newIndexItem = {};
					newIndexItem.word = value.word;
					newIndexItem.locations = [];
					var wordLetter = newIndexItem.word.substring(0,1).toUpperCase();
					angular.forEach(value.locations, function(value, key) {
						var locationObj = {};
						locationObj.courseId = $scope.getIndexOfObjWithOwnAttr($scope.courses,"title",value.course);
						locationObj.arcId = $scope.getIndexOfObjWithOwnAttr($scope.courses[locationObj.courseId].arcs,"title",value.arc);
						locationObj.moduleId = $scope.getIndexOfObjWithOwnAttr($scope.courses[locationObj.courseId].arcs[locationObj.arcId].modules,"name",value.module);
						locationObj.title = value.topic;
						locationObj.sectionId = value.url.replace("#","");
						newIndexItem.locations.push(locationObj);
					});
					if(newIndexItem.locations.length>0) {
						if(!(wordLetter in $scope.letters)) { $scope.letters[wordLetter] = []; }
						$scope.letters[wordLetter].push(newIndexItem);
					}
				}); if(isDev) $log.info("site index by letter",$scope.letters);
				$scope.goto = function(key) {
					var e = document.getElementById(key);
					if (!!e && e.scrollIntoView) {
						e.scrollIntoView();
					}
				};
				hit_path += "index";
				hit_title = "Site Index";
				break;
					
				
		}
		
		if($scope.course) {
			$scope.course.class = $scope.course.title==="Game Development Programming" ? "programming" : "design";
		}
		
		$scope.devpro.current.state = toState;
		$scope.devpro.current.course = parseInt(toParams.courseId);
		$scope.devpro.current.arc = parseInt(toParams.arcId);
		$scope.devpro.current.module = parseInt(toParams.moduleId);
		$scope.devpro.current.topic = parseInt(toParams.topicId);
		
		$scope.devpro.back.state = fromState;
		$scope.devpro.back.course = parseInt(fromParams.courseId);
		$scope.devpro.back.arc = parseInt(fromParams.arcId);
		$scope.devpro.back.module = parseInt(fromParams.moduleId);
		$scope.devpro.back.topic = parseInt(fromParams.topicId);
		
		$scope.devpro.screen = screen;
		
		$scope.collapseNav();
		
		if((toParams.hasOwnProperty("section")&&toParams.section!==null)||scroll_target) {
			if(!scroll_target) scroll_target = toParams.section;
			if(isDev) $log.warn("scrolling page to element: ",scroll_target);
			$timeout(function(){
				var e = document.getElementById(scroll_target);
				if (!!e && e.scrollIntoView) {
					e.scrollIntoView();
				}
			},100);
		} else {
			// scroll to top of page
			$window.scrollTo(0, 0)	
		}
		
		var hit_version = $scope.course ? $scope.course.version : "";
		analytics.sendPageview(hit_path,hit_title,hit_course,hit_version);
		
	});	
	
	if(isDev) $log.info("state handlers created");
	
	$scope.loadCourse = function(course_id) {
		if(isDev) $log.info("loading course",course_id);
		$state.transitionTo("course",{courseId:course_id});
	};

	$scope.loadArc = function(course_id,arc_id) {
		if(isDev) $log.info("loading arc",course_id,arc_id);
		$state.transitionTo("course.arc",{courseId:course_id,arcId:arc_id});
	};

	$scope.loadModule = function(course_id,arc_id,module_id) {
		if(isDev) $log.info("loading module",course_id,arc_id,module_id);
		var topic_id = 0; // overview
		$scope.loadTopic(course_id,arc_id,module_id,topic_id);
	};

	$scope.loadTopic = function(course_id,arc_id,module_id,topic_id) {
		if(isDev) $log.info("loading topic",course_id,arc_id,module_id,topic_id);
		if($rootScope.isMobile) {
			if(isDev) $log.warn("forcing a reload for ios support");
			$rootScope.forceReload = true; // for ios
		}
		$state.transitionTo("course.arc.module.topic",{courseId:course_id,arcId:arc_id,moduleId:module_id,topicId:topic_id},{ reload:true });
	};
	
	$scope.prevTopic = function() {
		if(isDev) $log.info("loading previous topic");
		var current = $scope.devpro.current;
		var prev_topic = current.topic-1;
		if(prev_topic>=0) $scope.loadTopic(current.course,current.arc,current.module,prev_topic);
	};
	
	$scope.nextTopic = function() {
		if(isDev) $log.info("loading next topic");
		var current = $scope.devpro.current;
		var next_topic = current.topic+1;
		if(next_topic<$scope.module.topics.length) $scope.loadTopic(current.course,current.arc,current.module,next_topic);
	};

	$scope.loadReference = function(course_id,arc_id,module_id) {
		if(isDev) $log.info("loading reference",course_id,arc_id,module_id);
		var topic_id = $scope.courses[course_id].arcs[arc_id].modules[module_id].topics.length-2;
		$scope.loadTopic(course_id,arc_id,module_id,topic_id);
	};

	$scope.loadReferenceSection = function(course_id,arc_id,module_id,section_id) {
		var topic_id = $scope.courses[course_id].arcs[arc_id].modules[module_id].reference_key;
		if(isDev) $log.info("loading reference section",course_id,arc_id,module_id,topic_id,section_id);
		$state.transitionTo("course.arc.module.topic",{courseId:course_id,arcId:arc_id,moduleId:module_id,topicId:topic_id,section:section_id});
	};

	$scope.loadExercise = function(course_id,arc_id,module_id) {
		if(isDev) $log.info("loading exercise",course_id,arc_id,module_id);
		var topic_id = $scope.courses[course_id].arcs[arc_id].modules[module_id].topics.length-1;
		$scope.loadTopic(course_id,arc_id,module_id,topic_id);
	};

	$scope.loadIndex = function(course_id) {
		if(isDev) $log.info("loading index");
		$state.transitionTo("index",{});
	};

	$scope.loadGlossary = function(course_id) {
		if(isDev) $log.info("loading glossary");
		$state.transitionTo("glossary",{});
	};
	
	$scope.collapseNav = function(course_id) {
		angular.forEach($scope.courses,function(course,topic_id) {
			course.nav_collapse = true;
		});
	};
	
	$scope.triggerPlaylist = function() {
		if(isDev) $log.info("triggered playlist"); 
		if(!$scope.topic.movie) {
			// restore playlist to previous state
			var current = $scope.devpro.current;
			if(current.arc===$scope.devpro.back.arc&&current.module===$scope.devpro.back.module) {
				if(!$scope.devpro.back.playlist) $scope.devpro.back.playlist = 0;
				$scope.loadTopic(current.course,current.arc,current.module,$scope.devpro.back.playlist);
			} else {
				$scope.loadTopic(current.course,current.arc,current.module,0);
			}
			$scope.devpro.playlist_active = true;
		} else {
			$scope.devpro.playlist_active = !$scope.devpro.playlist_active;
		}
	};
	
	$scope.getIndexOfObjWithOwnAttr = function(array, attr, value) {
		for(var i=0; i<array.length; i++) {
			if(array[i].hasOwnProperty(attr) && array[i][attr] === value) {
				return i;
			}
		}
		return -1;
	};
	
	if(isDev) $log.info("interface functions created");
	
	if($scope.courses.length===1&&!$scope.current) {
		$scope.loadCourse(0);
	}

});
