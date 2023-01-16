.PHONY: all
all: data dev

.PHONY: data
data:
	make -C data all

.PHONY: dev
dev:
	@node scripts/dev.mjs

.PHONY: dev2
dev2:
	@node scripts/dev2.mjs

.PHONY: setup-cache
setup-cache:
	@node scripts/setup-cache.mjs

.PHONY: dev-cache
dev-cache:
	@node scripts/dev-cache.mjs

.PHONY: test-cache
test-cache:
	@node scripts/test-cache.mjs
