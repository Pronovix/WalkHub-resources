all:
	java -jar closure-compiler.jar jquery.js jquery.cookie.js modernizr.mq.js jquery.joyride.js walkthrough.js > compiled.js
	java -jar closure-compiler.jar modernizr.mq.js jquery.joyride.js walkthrough.js > compiled-drupal.js

clean:
	rm compiled*.js
