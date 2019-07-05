/**
* quizmaster popcorn plug-in
* provides dynamic multiple-choice quizzes  (synced to video) to the page
* options for each question:
* - question is the text of the question
* - start is the time that you want to start showing video
* - limit is time limit for asnwering the question
* - choices is the list of answer choices available
* - by default, four random answers are chosen, one of which will always be the one worth the most points, all of which are shuffled up
* - if you want a particular "other" choice to always be offered, you can set it to "sticky":true
* - some choices will have an order specified which guarantees they will appear in a certain position relative to the other choices
* target is the id of the container 
*
* @param {Object} options
*
* Example:

popcorn_instance.quizmaster({
	debug: false,
	container_id: "player",
	video_id: "popcorn",
	audio_id: "sfx",
	controls: true,
	autoplay: false,
	allow_wrong_answers: false,
	hint_delay: 6,
	prompts[
		{
			start: 5, // seconds
			limit: 15, // seconds (optional, defaults to 0)
			hint_delay: 15, // seconds (optional, defaults to the top level hint_delay setting above)
			type: "multiple", // string, type of prompt to display at this point... defaults to "multiple" (only type that currently exists)
			question: 'What did video show?', // string
			hint: 'Helpful hint that shows after a few second delay', // string
			number_of_choices: 4, // number of choices to show on this prompt (optional, defaults to 4)
			choices: [ {  // array of choices to select from.. the first will always be shown, the rest are chosen at random
				text: 'Nothing', // text to show
				points: 0, // how many points is it worth? (optional, defaults to 0)
				order: 9, // choices that have an order assigned will ALWAYS be given a position relative to the others based on their order (non-ordered choices get a random order between 11-20)
				sticky: false, // forces this choice to always be included
			}],
			success { // optional, this object displays a message prompt before continuing if you get this correct
				message: "Here is why you got that right.", // body of the message (html ok)
				button: "" // text of the continue button (defaults to "try again" if wrong answers are not allowed, "continue" if wrong answers are allowed)
			},
			failure: { // optional, this object displays a message prompt before continuing if you get this correct
				message: "Here is why you got that wrong.", // body of the message (html ok)
				button: "" // text of the continue button (defaults to "try again" if wrong answers are not allowed, "continue" if wrong answers are allowed)
			}
		}
	]
});
 
* Authors:
* - Steve Elliott stevee@garagegames.com
* based on the popquiz plugin by 
* - Adarsh Uppula & Aaron Bazzone
* 
**/

(function(Popcorn) {
	Popcorn.plugin("quizmaster", function(options) {
		
		// override console.log
	//	if(window.console && console.log){ var original_console = console.log; console.log = function(){ if(!preferences.debug||!preferences.hasOwnProperty("debug")||typeof preferences === "undefined") return false; original_console.apply(this, arguments); } } 
		 
		var t = this;
		var manifest = {
			about: {
				name: "Popcorn Quiz Plugin",
				version: "0.2",
				author: "stevee@garagegames.com",
				website: "gginteractive.com"
			}
		};
		
		var defaults = {
			debug: false, // do you want debug info output to the console?
			api: null, // if using an external player to control video, set the object reference here
			container_id: "player", // set to id of the video player container
			video_id: "popcorn", // set to id of the video
			audio_id: "sfx", // set to id of the audio
			controls: true, // show controls on the video?
			autoplay: false, // should the video play as soon as it loads?
			allow_wrong_answers: false, // if false, the player will reset to the previous prompt if you get the answer wrong
			hint_delay: 6, // how many seconds until revealing the hint (if there is one)
		};
		
		var preferences = {
			
			init: function() {
				// console.log('called preferences.init()');
				// override default preferences with passed options
				Popcorn.forEach(defaults, function(value,key,item) {
					// start with the default
					preferences[key] = defaults[key];
					// console.log('processing '+key);
					if(tools.isSet(options[key])) {
						// overwrite preference with js passed option
						preferences[key] = options[key];
						// console.log('overwrote default '+key+' with value',preferences[key]);
					} else {
						// overwrite preference with page control
						var sel = tools.byId("preferences_"+key);
						if(sel) {
							if(key==="hint_delay") {
								// convert to integer
								preferences[key] = parseInt(sel.options[sel.selectedIndex].value);
							} else { 
								// convert to boolean
								preferences[key] = sel.options[sel.selectedIndex].value==="1" ? true : false;
							}
						}
					}
				});
				if(preferences.debug) console.log('preferences done processing');
				if(preferences.debug) console.log(preferences);
			}
			
		};
		
		var tools = { // utility functions
			byId: function(theId) { return document.getElementById(theId); }, // return element by passing id
			byClass: function(theClass) { return document.getElementsByClassName(theClass); }, // return array of elements by passing classname
			isSet: function(theVar) { return typeof theVar !== 'undefined' }, // return if the variable was defined
			shuffle: function(array) { for(var i=array.length-1; i>0; i--) { var j = Math.floor(Math.random() * (i+1)); var temp = array[i]; array[i] = array[j]; array[j] = temp; } return array; },
			getChar: function(e) { var chCode = ('charCode' in e) ? e.charCode : e.keyCode; return chCode; },
			addClass: function(el,theClass) { if(typeof el === "undefined") return false; var class_split = el.className.split(" "); class_split.push(theClass); el.className = class_split.join(" "); },
			removeClass: function(el,theClass) { if(typeof el === "undefined") return false; var class_results = []; var class_split = el.className.split(" "); for(var i=0;i<class_split.length;i++) { if(class_split[i] !== theClass) { class_results.push(class_split[i]); } } el.className = class_results.join(" "); },
			getTopChoice: function(choices) {
				var topVal = 0;
				var topKey = false;
				Popcorn.forEach(choices, function(choice,key,item) {
					if(preferences.debug) console.log("checking choice "+key,choice,item);
					if(tools.isSet(choice.points)&&choice.points>topVal) {
						topVal = choice.points;
						topKey = key;
						if(preferences.debug) console.log("...yes!");
					} else {
						if(preferences.debug) console.log("...nope");
					}
				});
				return topKey;
			},
			sortByOrder: function(a,b) { if(a.order<b.order) return -1; if(a.order>b.order) return 1; return 0; }
		};
		
		var globals = { // values used throughout the plugin
			init: function() {
				globals.current_prompt = -1;
				globals.chosen_points = 0;
				globals.skip_next_prompt = false;
				globals.timer = 0;
				globals.results = [];
				globals.timeouts = {};
				globals.callback = false; // this references a function to call after a prompt is cleared
				if(typeof globals.track_events === "undefined"||globals.track_events.length&&tools.byId(preferences.video_id)) {
					Popcorn.forEach(globals.track_events, function(track_event_id,key,item) {
						if(preferences.debug) console.log("remove track event","id:"+track_event_id,"key:"+key,"item:",item);
						t.removeTrackEvent(item[key]);
					});
				} globals.track_events = [];
			}
		};
		
		var els = { // element references
			init: function() {
				
				// setup the element references
				els.container = tools.byId(preferences.container_id);
				els.video = tools.byId(preferences.video_id);
				
				// add audio element
				var audioEl = document.createElement('audio');
				audioEl.id = preferences.audio_id;
				
				// add quiz form
				var formEl = document.createElement('div');
				formEl.id = "quizmaster";
				formEl.className = "quiz";

				// add question element
				var questionEl = document.createElement('h1');
				questionEl.id = "quizmaster_question";
				questionEl.className = "question";

				// add choices fieldset
				var choicesEl = document.createElement('fieldset');
				choicesEl.id = "quizmaster_choices";
				choicesEl.className = "choices";

				// add controls fieldset
				var controlsEl = document.createElement('fieldset');
				controlsEl.id = "quizmaster_controls";
				controlsEl.className = "controls";

				// add hint element
				var hintEl = document.createElement('p');
				hintEl.id = "quizmaster_hint";
				hintEl.className = "hint";

				// add indicator element
				var indicatorEl = document.createElement('ul');
				indicatorEl.id = "quizmaster_indicator";
				indicatorEl.className = "indicator";

				// add feedback element
				var feedbackEl = document.createElement('div');
				feedbackEl.id = "quizmaster_feedback";
				feedbackEl.className = "feedback";

				// add message element
				var messageEl = document.createElement('h2');
				messageEl.id = "quizmaster_message";
				messageEl.className = "message";

				// add continue button
				var continueEl = document.createElement('button');
				continueEl.id = "quizmaster_continue";
				continueEl.className = "btn btn-lg btn-white";
				continueEl.innerHTML = "Continue";
				continueEl.setAttribute("disabled",true);
				continueEl.setAttribute("quizmaster-keycode",13);
				continueEl.onclick = function() { return false; };

				// add submit button
				var buttonEl = document.createElement('button');
				buttonEl.id = "quizmaster_submit";
				buttonEl.className = "btn btn-lg btn-warning";
				buttonEl.type = "submit";
				buttonEl.innerHTML = "Submit";
				buttonEl.setAttribute("disabled",true);
				buttonEl.setAttribute("quizmaster-keycode",13);
				buttonEl.onclick = function() { checkAnswer();  };

				// add the nodes and references now
				els.container.innerHTML = "";
				els.container.appendChild(audioEl); els.audio = tools.byId(preferences.audio_id);
				els.container.appendChild(formEl); els.quiz = tools.byId("quizmaster");
				els.quiz.appendChild(questionEl); els.question = tools.byId("quizmaster_question");
				els.quiz.appendChild(choicesEl); els.choices = tools.byId("quizmaster_choices");
				els.quiz.appendChild(feedbackEl); els.feedback = tools.byId("quizmaster_feedback");
				els.quiz.appendChild(indicatorEl); els.indicator = tools.byId("quizmaster_indicator");
				els.feedback.appendChild(messageEl); els.message = tools.byId("quizmaster_message");
				els.feedback.appendChild(continueEl); els.continue_button = tools.byId("quizmaster_continue");
				els.quiz.appendChild(controlsEl); els.controls = tools.byId("quizmaster_controls");
				els.quiz.appendChild(hintEl); els.hint = tools.byId("quizmaster_hint");
				els.controls.appendChild(buttonEl); els.submit_button = tools.byId("quizmaster_submit");
				
			}
		};
		
		var prompts = [];
		
		var setup = function(options) {
			
			if(preferences.debug) console.log('setup called',options);
			
			t.disable();
			t.load();
			preferences.init();
			globals.init();
			els.init();
			t.controls(preferences.controls);
			
			if(preferences.debug) console.log(options.prompts);
			// now setup the timeline so we know when to interrupt the video
			prompts = options.prompts;
			
			if(preferences.debug) console.log('generated array of prompts',prompts);
			
			Popcorn.forEach(prompts, function(obj,key,item) {
				if(preferences.debug) console.log('processing prompt '+key,obj);
				
				// set some defaults for certain things if they were not defined
				if(!tools.isSet(obj.start)) obj.start = 0;
				if(!tools.isSet(obj.limit)) obj.limit = 0;
				if(!tools.isSet(obj.hint)) obj.hint = null;
				if(!tools.isSet(obj.hint_delay)) obj.hint_delay = defaults.hint_delay;
				if(!tools.isSet(obj.type)) obj.type = "multiple";
				if(!tools.isSet(obj.number_of_choices)) obj.number_of_choices = 4;
				if(!tools.isSet(obj.image)) obj.image = null;
				if(!tools.isSet(obj.success)) obj.success = null;
				if(!tools.isSet(obj.failure)) obj.failure = null;
				
				globals.results.push({ score:0, attempts:0 });
				var newIndicator = document.createElement('li');
				newIndicator.setAttribute("data-promptkey",key);
				els.indicator.appendChild(newIndicator);
				t.cue(obj.start,function() {
					runPrompt(key);
				}); globals.track_events.push(t.getLastTrackEventId());
				
			});
			syncResults();
			if(preferences.debug) console.log('prompts done processing');
			if(preferences.debug) console.log(prompts);
			
			// now build the interface
			
			//tools.byId("preferences_reset").onclick = function() {
			//	restart(options);
			//};
			
			
			t.enable();
				
			if(preferences.autoplay===true) {
				if(preferences.debug) console.log('playing because autoplay is true');
				goPlayer(); // play the video
			}
			//else stopPlayer(); // pause the video

		};
		
		var syncResults = function() {
			if(tools.isSet(preferences.api)) preferences.api.video.updateResults(globals.results);
			if(preferences.debug) console.log('sending results to api...',preferences.api.video.results);
		};
		
		var stopPlayer = function() {
			if(preferences.debug) console.log('stopPlayer called');
			t.pause();
		};
		
		var goPlayer = function() {
			disableInputs();
			if(preferences.debug) console.log('goPlayer called');
			//t.play();
			preferences.api.video.reset(true);
		};
		
		var runFeedback = function(key,result) {
			if(preferences.debug) console.log('runFeedback called',key,result);
			
			var resultName = result ? "success" : "failure";
			els.continue_button.removeAttribute("disabled");
			els.audio.src = "./sfx/"+resultName+".wav"; // set feedback message based on the choice made
			els.message.innerHTML = prompts[key][resultName].message;
			if(result||preferences.allow_wrong_answers) {
				els.continue_button.innerHTML = prompts[key][resultName].button ? prompts[key][resultName].button : "Continue";
			} else {
				els.continue_button.innerHTML = prompts[key][resultName].button ? prompts[key][resultName].button : "Try Again";
			}
			els.submit_button.setAttribute("disabled",true);
			els.continue_button.onclick = function() { clearPrompt(result); };
			els.continue_button.removeAttribute("disabled");
			els.choices.className = "choices "+resultName; // set the class name to give feedback based on the choice made 
			els.feedback.className = "feedback "+resultName; // set the class name to give feedback based on the choice made 
			els.audio.src = "./sfx/"+resultName+".wav"; // set the correct sound effect
			els.audio.volume = result ? 0.1 : 0.25;
			els.audio.play();
			
		};
		
		var endFeedback = function() {
			
			if(preferences.debug) console.log('endFeedback called',key);
			
		};
		
		var runPrompt = function(key) {
			
			if(preferences.debug) console.log('runPrompt called',key,'results',globals.results[key]);
			
			if(tools.isSet(globals.results[key])&&globals.results[key].score!==0||globals.skip_next_prompt) {
				globals.skip_next_prompt = false;
				if(preferences.debug) console.log('skipping prompt, it was already correctly answered'); // if you got it right already, skip it!
				return false;
			}
			
			var prompt = prompts[key];
			if(preferences.debug) console.log(prompt);
			
			if(!tools.isSet(prompt)) {
				if(preferences.debug) console.log('tried to load a prompt that does not exist ('+key+')','prompts:',prompts);
				return false;
			}
			
			// pause playback
			stopPlayer();
			
			// set the current prompt to this one
			globals.current_prompt = key;
			if(key>=0) tools.addClass(els.indicator.querySelector('li[data-promptkey="'+key+'"]'),"current");
			
			// set question text
			setQuestion(prompt.question);
			
			// set choices
			var choices = getChoices(prompt.number_of_choices); // get the right number of choices based on the extremely complicated criteria
			
			// add the html for each answer to the choices fieldset
			for(var i=0;i<choices.length;i++) {
				setChoice(choices[i],i);
			}
			
			// set hint text
			var myHintDelay = tools.isSet(prompt.hint_delay) ? prompt.hint_delay : preferences.hint_delay;
			setHint(prompt.hint,myHintDelay);
			
			// set the timer to the number of seconds allowed for this prompt
			globals.timer = tools.isSet(prompt.limit) ? prompt.limit : 0; // default to 0 if no limit set
			
			// reveal quiz overlay
			revealQuiz();
			
		};
		
		var getChoices = function(count) {
			
			
			if(preferences.debug) console.log('getChoices called',count,'current prompt',globals.current_prompt);
			
			var all_choices = prompts[globals.current_prompt].choices.slice(); // clone the choices for this prompt first (don't ruin the original)
			var result_choices = []; // for holding the rsults
			
			if(preferences.debug) console.log('length of result_choices ',result_choices.length);
			if(preferences.debug) console.log('length of all choices ',all_choices.length);
			
			// okay first of all let's figure out what the top answer is and include that by default
			var top_choice_key = tools.getTopChoice(all_choices);
			if(top_choice_key===false) {
				if(preferences.debug) console.log('PROMPT ERROR: there was no correct answer to choose from!');
				return false;
			}
			
			var top_choice = all_choices[top_choice_key];
			
			if(preferences.debug) console.log('top choice',top_choice_key,top_choice);
			
			result_choices.push(top_choice); // create an answer array containing the first choice (correct answer)
			all_choices.splice(top_choice_key,1); // remove the top choice from the all_choices array
		
			if(preferences.debug) console.log('length of result_choices ',result_choices.length);
			if(preferences.debug) console.log('length of all choices ',all_choices.length);	

			// now lets get all of the choices remaining that are "sticky" i.e. they must be included, and enough other random ones to satisfy our count
			for(var i=0;i<all_choices.length;i++) {
				if(tools.isSet(all_choices[i].sticky)&&all_choices[i].sticky) {
					result_choices.push(all_choices[i]); // add it
					all_choices.splice(i,1); // remove it
				}
			}
			
			if(preferences.debug) console.log('length of result_choices ',result_choices.length);
			if(preferences.debug) console.log('length of all choices ',all_choices.length);
			
			// if the number of sticky choices brings us up to or beyond our required count, great, otherwise we need to grab some more (at random)
			if(result_choices.length<count) {
				var remaining = count - result_choices.length; // how many more do we need??
				for(var i=0;i<remaining;i++) {
					tools.shuffle(all_choices); // randomize
					var chosen_one = all_choices.shift(); // grab the first one
					if(chosen_one.text!=="") {
						result_choices.push(chosen_one);
					} else {
						if(preferences.debug) console.log('skipping this choice as it has a blank answer for some reason');
					}
				}
			} // okay we either have enough now, or there just weren't enough in the first place..
			
			// assign a random order to any selected choices which do not have one already assigned
			Popcorn.forEach(result_choices, function(choice,key,item) {
				if(preferences.debug) console.log('reordered choice '+key,choice);
				if(!tools.isSet(choice.order)||choice.order===0) choice.order = Math.floor(Math.random()*10)+11; // random int between 11 and 20
				if(preferences.debug) console.log('reordered choice '+key,choice);
			});
			
			// reorder based on the orders that were assigned or randomly generated
			result_choices.sort(tools.sortByOrder);
			return result_choices;
			
		};
		
		var revealQuiz = function() {
			
			if(preferences.debug) console.log('revealQuiz called');
			tools.addClass(els.container,"active");
			tools.addClass(els.quiz,"active");
			tools.addClass(els.video,"freeze");
			enableInputs();
			
		};
		
		var setQuestion = function(question) { 
			if(preferences.debug) console.log('setQuestion called',question);
			els.question.innerHTML = question;
		};
		
		var setHint = function(hint,delay) { 
			if(preferences.debug) console.log('setHint called',hint,delay);
			els.hint.innerHTML = hint!==null ? hint : "";
			if(delay>=0) {
				globals.timeouts.hint = setTimeout(function() {
					revealHint(delay);
				}, (delay*1000));
			}
		};
		
		var revealHint = function(delay) { 
			if(preferences.debug) console.log('revealHint called',delay);
			els.hint.className = "hint showing";
		};
		
		var setChoice = function(choice,key) {
			if(preferences.debug) console.log('setChoice called',choice,key);

			var newAnswer = document.createElement('button'); 
			newAnswer.value = choice.points;
			newAnswer.innerHTML = (1+key)+'<b>'+choice.text+'</b>';
			newAnswer.setAttribute("quizmaster-keycode",49+key);
			newAnswer.setAttribute("type","button");
			newAnswer.onclick = function() {
				if(this.parentElement.className!=="chosen") {
					els.submit_button.removeAttribute("disabled");
					globals.chosen_points = choice.points;
					var previously_chosen = tools.byClass("chosen");
					if(previously_chosen) {
						for(var i=0; i<previously_chosen.length;i++) {
							tools.removeClass(previously_chosen[i],"chosen");
						}
					}
					tools.addClass(this.parentElement,"chosen"); // add the chosen class to this answer
				}
			};
			
			var newLabel = document.createElement('label');   
			newLabel.id = "answer_" + key;
			newLabel.appendChild(newAnswer);
			els.choices.appendChild(newLabel);
			
		};
		
		var enableInputs = function() {
			if(preferences.debug) console.log('enableInputs called');
			if(preferences.api) preferences.api.disableInputs();
			window.onkeypress = function() {
				var keyCode = tools.getChar(event);
				var buttons = els.quiz.querySelectorAll('button[quizmaster-keycode="'+keyCode+'"]');
				if(preferences.debug) console.log("pressed key:",keyCode);
				if(buttons.length) {
					for(var i=0;i<buttons.length;i++) {
						if(!buttons[i].hasAttribute("disabled")) {
							if(preferences.debug) console.log('clicking a button',buttons[i]);
							buttons[i].click();
						}
					}
				}
			};
			
		};
		
		var disableInputs = function() {
			if(preferences.debug) console.log('disableInputs called');
			els.submit_button.setAttribute("disabled",true);
			els.continue_button.setAttribute("disabled",true);
			window.onkeypress = null;
			if(preferences.api) preferences.api.enableInputs();
		};
		
		var clearPrompt = function(result) { // run this after the answer is correct or the answer is wrong and they are allowed to continue
			if(preferences.debug) console.log('clearPrompt called',result,preferences.allow_wrong_answers);
			proceed = result||preferences.allow_wrong_answers;
			setTimeout(function() {
				tools.removeClass(els.quiz,"active");
				tools.addClass(els.quiz,"finished");
				setTimeout(function() {
					tools.removeClass(els.video,"freeze");
					tools.removeClass(els.quiz,"finished");
					tools.removeClass(els.container,"active");
					tools.removeClass(els.indicator.querySelector('li[data-promptkey="'+globals.current_prompt+'"]'),"current");
					els.question.innerHTML = "";
					els.choices.innerHTML = "";
					els.choices.className = "choices";
					els.feedback.className = "feedback";
					els.message.innerHTML = "";
					els.submit_button.setAttribute("disabled",true);
					els.continue_button.setAttribute("disabled",true);
					els.continue_button.onclick = function() { return false; };
					els.hint.className = "hint";
					globals.timer = 0;
					globals.chosen_points = 0;
					killTimeouts();
					if(proceed) {
						if(globals.callback) {
							if(preferences.debug) console.log('firing the callback callback');
							globals.callback();
						} else {
							if(preferences.debug) console.log('playing because correct answers are allowed');
							goPlayer(); // continue the video
						}
					} else {
						// they got it wrong and wrong answers are unacceptable
						globals.current_prompt--;
						if(preferences.debug) console.log('globals.current_prompt changed to',globals.current_prompt);
						//if(globals.current_prompt>=0) globals.skip_next_prompt = true; // necessary so when we rewind to the last prompt it doesn't fire off
						//var replayFrom = globals.current_prompt>=0 ? prompts[globals.current_prompt].start : 0;
						var replayFrom = 0; // all prompts are at the end of videos currently, so just send it to 0 cause IE11 was having some issues
						t.currentTime(replayFrom);
						preferences.api.video.vjs.currentTime(replayFrom);
						if(preferences.debug) console.log('playing from '+replayFrom+' because wrong answers are not allowed and we have rewound');
						goPlayer();
					}
				}, 600);
			}, 1);
		};
		
		var setTime = function(newTime) {
			t.currentTime(newTime);
		};
		
		var checkAnswer = function() {
			if(preferences.debug) console.log('checkAnswer called');
			els.submit_button.setAttribute("disabled",true);
			var choice_buttons = els.choices.querySelectorAll('button');
			if(choice_buttons.length>0) {
				for(var i=0;i<choice_buttons.length;i++) { choice_buttons[i].setAttribute("disabled",true); }
			} els.submit_button.setAttribute("disabled",true);
			els.continue_button.removeAttribute("disabled");
			var result = globals.chosen_points>0;
			var resultClass = result ? "success" : "failure";
			// set the class of the indicator for this question
			els.indicator.querySelector('li[data-promptkey="'+globals.current_prompt+'"]').className = "current "+resultClass;
			globals.results[globals.current_prompt].score = globals.chosen_points; // set the result points for this prompt to the value of the selected choice
			globals.results[globals.current_prompt].attempts++; // add another attempt to this particular prompt
			syncResults();
			runFeedback(globals.current_prompt,result);
			if(preferences.debug) console.log('updated results for prompt '+globals.current_prompt,globals.results[globals.current_prompt]);
		};
		
		var killTimeouts = function() {
			if(tools.isSet(globals.timeouts)) {
				for(var i=0;i<globals.timeouts.length;i++) {
					clearTimeout(globals.timeouts[i]);
				}
			};	
		};
		
		var restart = function(options) {
			if(preferences.debug) console.log('restart called');
			// kill any lingering timeouts
			killTimeouts();
			setup(options);
		};
		
		// the function that runs at the end of a video to assure all prompts have been displayed
		var finalCountdown = function() {
					
				// first let's go through and if there are any prompts that were NOT fired, setup a chain reaction
				// when those are done then we will tell the caller (api.video) to go ahead and show the results
				
				var all_done = true;
				globals.callback = false;
				for(var i=0;i<globals.results.length;i++) {
					if(preferences.debug) console.log('checking prompt #'+i);
					if(globals.results[i].attempts===0||(!preferences.allow_wrong_answers&&globals.results[i].score===0)) { // it was never shown, or wrong answers are not allowed and it was never correctly answered
						if(globals.results[i].attempts===0) {
							if(preferences.debug) console.log('it was never shown! showing it in 5, 4, 3, 2, 1...');
						} else {
							if(preferences.debug) console.log('it was never correctly answered! showing it in 5, 4, 3, 2, 1...');
						}
						all_done = false; // this is apparently not true
						globals.callback = function() { finalCountdown(); }; // make sure this gets called again after the prompt is done
						runPrompt(i); // show the prompt
						break; // wait for the callback
					} else {
						// it was shown before so please continue
						if(preferences.debug) console.log('it was shown '+globals.results[i].attempts+' times already and score was '+globals.results[i].score,preferences.allow_wrong_answers);
					}
				}
				
				if(all_done) {
					// tell the api it's time to show the results
					if(preferences.debug) console.log('all prompts were shown so now we will unleash the results screen!');
					if(preferences.api) {
						if(preferences.debug) console.log(preferences.api);
						preferences.api.show_results();
					}
				}
				

		};
		
		// must return object w/ start and end functions
		return {
			
			// fires off when the video starts
			_setup: function(track) {
				
				if(preferences.debug) console.log('[QUIZMASTER SETUP] called');
				//setup(options);

			},
			
			// fires off when the plugin is destroyed
			_teardown: function(track) {
				
				if(preferences.debug) console.log('[QUIZMASTER TEARDOWN] called');
				// clear the action
				tools.removeClass(els.video,"freeze");
				tools.removeClass(els.container,"active");
				tools.removeClass(els.quiz,"active");
				// kill any lingering timeouts
				killTimeouts();

			},
			
			// fires off on every frame
			frame: function(event,track) {
				//if(preferences.debug) console.log("popcorn frame ran",this.currentTime());
			},
			
			// fires off when the video starts
			start: function(event,track) {
			
				if(preferences.debug) console.log('quizmaster start called',track);
				restart(options);

			},

			// when the video reaches the end
			end: function(event,track) {
				
				if(preferences.debug) console.log('quizmaster end of track reached',track);
				
			},
			
			timeupdate: function(event, options) {
				
				//if(preferences.debug) console.log('timeupdate called',event,options);
				
			},
			
			// called by the video player when things are done
			final_countdown: function() {
				
				if(preferences.debug) console.log('quizmaster starting the final countdown...');
				finalCountdown(); // let the fun begin...
				
			}
			
		};
		
	});
})(Popcorn);