.PHONY: all utilities compositions

all: utilities compositions

utilities:
	@echo "Generating utilities data"
	@bun scripts/update-utilities.mjs
	@echo "Success: utilities data generated"

compositions:
	@echo "Generating compositions data"
	@bun scripts/update-compositions.mjs
	@echo "Success: compositions data generated"
