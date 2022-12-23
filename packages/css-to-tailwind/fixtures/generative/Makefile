.PHONY: all base

all: base modifiers

base:
	@echo "Generating base data"
	@bun scripts/update-base.mjs
	@echo "Success: base data generated"

modifiers:
	@echo "Generating modifiers data"
	@bun scripts/update-modifiers.mjs
	@echo "Success: modifiers data generated"
