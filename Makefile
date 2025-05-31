.DEFAULT_GOAL := help
.PHONY: help init build package clean all

help:
	@echo "make init    - npm install"
	@echo "make build   - npm run compile"
	@echo "make package - npx vsce@latest package"
	@echo "make clean   - rm -rf node_modules out *.vsix"
	@echo "make all     - clean → init → build"

all: clean init build
init: ; npm install
build: ; npm run compile
package: ; npx vsce@latest package
clean: ; rm -rf node_modules out *.vsix package-lock.json
