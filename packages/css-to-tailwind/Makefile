.POHNY: all clean

all: clean prompts.json

clean:
	@echo "Cleaning up"
	@rm -f data/*.json
	@echo "Success: cleaned up"

utilities.json:
	@bun data/utilities.mjs
	@echo "Success: utilities.json"

utilities-resolved.json: utilities.json
	@node data/utilities-resolved.mjs
	@echo "Success: utilities-resolved.json"

utilities-filtered.json: utilities.json utilities-resolved.json
	@bun data/utilities-filtered.mjs
	@echo "Success: utilities-filtered.json"

utility-types.json: utilities-resolved.json
	@node data/utility-types.mjs
	@echo "Success: utility-types.json"

compositions.json: utilities-filtered.json
	@node data/compositions.mjs
	@echo "Success: compositions.json"

compositions-resolved.json: compositions.json utilities-resolved.json
	@node data/compositions-resolved.mjs
	@echo "Success: compositions-resolved.json"

prompts.json: compositions-resolved.json
	@node data/prompts.mjs
	@echo "Success: prompts.json"

.PHONY: dev
dev: utility-types.json utilities-filtered.json compositions-resolved.json
	@node scripts/dev.mjs
