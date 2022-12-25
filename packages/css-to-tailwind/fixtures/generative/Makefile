.POHNY: all

all: clean compositions/compositions-resolved.json

clean:
	@echo "Cleaning up"
	@rm -f utilities/utilities.json
	@rm -f compositions/compositions.json
	@rm -f compositions/compositions-resolved.json
	@echo "Success: cleaned up"

utilities/utilities.json:
	@echo "Generating utilities data"
	@bun scripts/update-utilities.mjs
	@echo "Success: utilities data generated"

compositions/compositions.json: utilities/utilities.json
	@echo "Generating compositions data"
	@bun scripts/update-compositions.mjs
	@echo "Success: compositions data generated"

compositions/compositions-resolved.json: compositions/compositions.json
	@echo "Generating resolved compositions data"
	@node scripts/update-compositions-resolved.mjs
	@echo "Success: resolved compositions data generated"
