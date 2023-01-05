.POHNY: all clean

all: utility-types.json prompts.json

clean:
	@echo "Cleaning up"
	@rm -f *.json
	@echo "Success: cleaned up"

utilities.json:
	@bun utilities.mjs
	@echo "Success: utilities.json"

utilities-resolved.json: utilities.json
	@node utilities-resolved.mjs
	@echo "Success: utilities-resolved.json"

utilities-filtered.json: utilities.json utilities-resolved.json
	@bun utilities-filtered.mjs
	@echo "Success: utilities-filtered.json"

utility-types.json: utilities-resolved.json
	@node utility-types.mjs
	@echo "Success: utility-types.json"

compositions.json: utilities-filtered.json
	@node compositions.mjs
	@echo "Success: compositions.json"

compositions-resolved.json: compositions.json utilities-resolved.json
	@node compositions-resolved.mjs
	@echo "Success: compositions-resolved.json"

prompts.json: compositions-resolved.json
	@node prompts.mjs
	@echo "Success: prompts.json"
