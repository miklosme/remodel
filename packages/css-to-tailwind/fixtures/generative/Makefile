.POHNY: all clean

all: clean compositions-resolved.json

clean:
	@echo "Cleaning up"
	@rm -f utilities.json
	@rm -f compositions.json
	@rm -f compositions-resolved.json
	@echo "Success: cleaned up"

utilities.json:
	@echo "Generating utilities data"
	@bun scripts/utilities.mjs
	@echo "Success: utilities data generated"

compositions.json: utilities.json
	@echo "Generating compositions data"
	@bun scripts/compositions.mjs
	@echo "Success: compositions data generated"

compositions-resolved.json: compositions.json
	@echo "Generating resolved compositions data"
	@node scripts/compositions-resolved.mjs
	@echo "Success: resolved compositions data generated"
