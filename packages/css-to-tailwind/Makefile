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
