default:
	cfx xpi
	zip -r oab-fxaddon-obfuscated-src.zip obfuscated/

test:
	cfx run

clean:
	rm oab-fxaddon.xpi
	rm oab-fxaddon-obfuscated-src.zip
