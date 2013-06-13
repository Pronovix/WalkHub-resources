prodc = java -jar closure-compiler.jar
debugc = cat

jquery = jquery.js jquery.cookie.js
modernizr = modernizr.mq.js
joyride = jquery.joyride.js
app = walkthrough.js

allfiles = $(jquery) $(modernizr) $(joyride) $(app)
drupal = $(modernizr) $(joyride) $(app)

all:
	$(prodc) $(allfiles) > compiled.js
	$(prodc) $(drupal) > compiled-drupal.js

debug:
	$(debugc) $(allfiles) > compiled.js
	$(debugc) $(drupal) > compiled-drupal.js

clean:
	rm compiled*.js
