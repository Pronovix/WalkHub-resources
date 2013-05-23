all:
	java -jar closure-compiler.jar jquery.js jquery.cookie.js modernizr.mq.js jquery.joyride.js walkthrough.js > compiled.js

clean:
	rm compiled.js
