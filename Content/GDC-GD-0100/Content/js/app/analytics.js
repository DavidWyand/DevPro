var ACT_CODE = "36351af9-16f0-76f2-5c3e-554b-e2995c73";
var MACH_NAME = "DESKTOP-U85L0E6";
var ORG_NAME = "EricSchool1219142 (9)";
var VERSION_LBL = ""; // first four lines get overwritten by launcher
var COURSE_PLATFORM = 'Desktop';

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

// Inject Analytics
app.factory('analytics', function ($rootScope, $window, $location, $log) {
	
	var analytics = {};
	if($window.ga) {
		
		if(isDev) $log.warn('initializing analytics');
		
		if(!$rootScope.isHosted&&!$rootScope.isDemo) { // local version running from launcher
			var client_id = ACT_CODE!=="" ? ACT_CODE+"_"+MACH_NAME : generateUUID();
			if(isDev) $log.warn('generated id for analytics session: ',client_id);
			$window.ga('create', 'UA-6057184-11', {
				storage:'none',
				clientId:client_id,
				cookieDomain:'devpro.gginteractive.com'
			});
		} else {
			
			COURSE_PLATFORM = $rootScope.isDemo ? 'Demo' : 'Hosted';
			var client_id = "cookie";
			$window.ga('create','UA-6057184-11', {
				cookieDomain:'devpro.gginteractive.com'
			});
		}
		
		$window.ga('require', 'linker');
		$window.ga('linker:autoLink', ['gginteractive.com']);
		$window.ga('set', 'checkProtocolTask', null);
		$window.ga('set', 'dimension1', COURSE_PLATFORM);
		$window.ga('set', 'dimension2', ACT_CODE);
		$window.ga('set', 'dimension3', MACH_NAME);
		$window.ga('set', 'dimension5', ORG_NAME);
			
	}

	// Set the page to the current location path
	// and then send a pageview to log path change.
	analytics.sendPageview = function(hit_path,hit_title,hit_course,hit_version) {
		if(typeof hit_path==="undefined") hit_path = $location.url();
		if(typeof hit_title==="undefined") hit_title = "";
		if(typeof hit_course==="undefined") hit_course = "";
		if(typeof hit_version==="undefined") hit_version = "";
		if($window.ga) {
			$window.ga('set', 'dimension4', hit_course);
			$window.ga('set', 'dimension6', hit_version);
			$window.ga('send',  {
				"hitType": "pageview",
				"page": hit_path,
				"title": hit_title,
				"hitCallback": function() {
					if(isDev) $log.info("google analytics: page view sent"," | client_id: ",client_id," | course platform: ",COURSE_PLATFORM," | activation code: ",ACT_CODE," | machine name: ",MACH_NAME," | course title: ",hit_course," | course version: ",hit_version," | page: ",hit_path," | title: ",hit_title);
				}
			});
		}
	};

	return analytics;
	
})
.run(function(analytics) {
});
// inject self

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};
