.POHNY: clean all

all: utility-types.json prompts.json cache.json

clean:
	@echo "Cleaning up"
	@rm -f *.json
	@echo "Success: cleaned up"

utilities.json:
	@bun utilities.mjs
	@echo "Success: utilities.json"

utilities-resolved.json: utilities.json
	if [ -f utilities-resolved.CACHE.json ]; then \
		cp utilities-resolved.CACHE.json utilities-resolved.json; \
	else \
		node utilities-resolved.mjs; \
		cp utilities-resolved.json utilities-resolved.CACHE.json; \
	fi
	@echo "Success: utilities-resolved.json"

utilities-filtered.json: utilities.json utilities-resolved.json
	@bun utilities-filtered.mjs
	@echo "Success: utilities-filtered.json"

utility-types.json: utilities-resolved.json
	@node utility-types.mjs
	@echo "Success: utility-types.json"

utilities-tokenized.json: utilities-resolved.json
	@node utilities-tokenized.mjs
	@echo "Success: utilities-tokenized.json"

compositions.json: utilities-filtered.json
	@node compositions.mjs
	@echo "Success: compositions.json"

compositions-resolved.json: compositions.json utilities-resolved.json
	@node compositions-resolved.mjs
	@echo "Success: compositions-resolved.json"

prompts.json: compositions-resolved.json
	@node prompts.mjs
	@echo "Success: prompts.json"

cache.json: compositions-resolved.json
	@node cache.mjs
	@echo "Success: cache.json"
