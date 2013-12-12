prodc = java -jar tools/closure-compiler.jar
debugc = cat

jquery = src/javascript/jquery.js src/javascript/noconflict.js src/javascript/jquery.cookie.js
urijs = src/javascript/URI.js
modernizr = src/javascript/modernizr.mq.js
joyride = src/javascript/jquery.joyride.js
app = src/javascript/walkthrough.js

allfiles = $(jquery) $(modernizr) $(joyride) $(urijs) $(app)

all: javascript sass

debug: javascript_debug sass

javascript:
	$(prodc) $(allfiles) > compiled.js

javascript_debug:
	$(debugc) $(allfiles) > compiled.js

sass:
	compass compile

clean:
	rm compiled*.js
	compass clean
