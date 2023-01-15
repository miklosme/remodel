.PHONY: all
all: data dev

.PHONY: data
data:
	make -C data all

.PHONY: dev
dev:
	@node scripts/dev.mjs

.PHONY: setup-cache
setup-cache:
	@node scripts/setup-cache.mjs

.PHONY: dev-cache
dev-cache:
	@node scripts/dev-cache.mjs

.PHONY: test-cache
test-cache:
	@node scripts/test-cache.mjs
