
.DEFAULT_GOAL := import

friendmex:
	git clone -n --depth=1 --filter=tree:0 https://github.com/Anish-Agnihotri/friendmex friendmex
	cd friendmex && git sparse-checkout set --no-cone indexer && git checkout && rm -rf .git

.PHONY: clean
clean:
	rm -rf friendmex

friendmex/indexer/Dockerfile: friendmex Dockerfile
	cp Dockerfile friendmex/indexer/

import: friendmex/indexer/Dockerfile
