.POHNY: all clean

all: clean prompts.json

clean:
	@echo "Cleaning up"
	@rm -f *.json
	@echo "Success: cleaned up"

utilities.json:
	@bun scripts/utilities.mjs
	@echo "Success: utilities.json"

utilities-resolved.json: utilities.json
	@node scripts/utilities-resolved.mjs
	@echo "Success: utilities-resolved.json"

utilities-filtered.json: utilities.json utilities-resolved.json
	@bun scripts/utilities-filtered.mjs
	@echo "Success: utilities-filtered.json"

compositions.json: utilities-filtered.json
	@node scripts/compositions.mjs
	@echo "Success: compositions.json"

compositions-resolved.json: compositions.json utilities-resolved.json
	@node scripts/compositions-resolved.mjs
	@echo "Success: compositions-resolved.json"

prompts.json: compositions-resolved.json
	@node scripts/prompts.mjs
	@echo "Success: prompts.json"
