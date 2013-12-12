prodc = java -jar tools/closure-compiler.jar
debugc = cat

jquery = src/jquery.js src/noconflict.js src/jquery.cookie.js
modernizr = src/modernizr.mq.js
joyride = src/jquery.joyride.js
app = src/walkthrough.js

allfiles = $(jquery) $(modernizr) $(joyride) $(app)

all:
	$(prodc) $(allfiles) > compiled.js

debug:
	$(debugc) $(allfiles) > compiled.js

clean:
	rm compiled*.js
