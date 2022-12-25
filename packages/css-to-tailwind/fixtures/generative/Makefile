.POHNY: all clean

all: clean prompts.json

clean:
	@echo "Cleaning up"
	@rm -f utilities.json
	@rm -f compositions.json
	@rm -f compositions-resolved.json
	@echo "Success: cleaned up"

utilities.json:
	@bun scripts/utilities.mjs
	@echo "Success: utilities.json"

compositions.json: utilities.json
	@bun scripts/compositions.mjs
	@echo "Success: compositions.json"

compositions-resolved.json: compositions.json
	@node scripts/compositions-resolved.mjs
	@echo "Success: compositions-resolved.json"

compositions-filtered.json: compositions-resolved.json
	@node scripts/compositions-filtered.mjs
	@echo "Success: compositions-filtered.json"

prompts.json: compositions-resolved.json
	@node scripts/prompts.mjs
	@echo "Success: prompts.json"
