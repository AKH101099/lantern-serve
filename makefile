MAKEFLAGS += --warn-undefined-variables
SHELL := /bin/bash
TAG?=latest
CERTDIR := ./web/certs/
DEVHOST := dev.lantern.link
CERTS := $(CERTDIR)$(DEVHOST).pem

.PHONY: build certs clean install start run stage deploy $(PLATFORM)

build: $(CERTS)
	docker-compose -f env/dc-dev.yml build

install:
	npm install
	git submodule update --init --recursive
	
start: $(CERTS)
	HOOK_ADD="../hooks/change" \
	HOOK_DROP="../hooks/change" \
	HOOK_UPDATE="../hooks/change" \
	HOOK_RESTORE="../hooks/restore" \
	HOOK_BACKUP="../hooks/backup" \
	npm start	

pack:
	browserify platform/web.js --standalone LX --outfile web/public/scripts/platform.js
	uglifyjs web/public/scripts/platform.js -o web/public/scripts/platform.min.js 
	cat \
     'node_modules/bulma/css/bulma.min.css' \
     'node_modules/leaflet/dist/leaflet.css' \
     'node_modules/leaflet.locatecontrol/dist/L.Control.Locate.min.css' \
     'node_modules/@fortawesome/fontawesome-free/css/all.min.css' \
     'node_modules/typeface-montserrat/index.css' \
	>> web/public/styles/vendor.css
run:
	docker-compose -f env/dc-dev.yml up

stage:
	docker-compose -f env/dc-stage.yml build
	docker-compose -f dc-stage.yml up -d

deploy:
	triton profile set-current lantern
	triton-compose -f env/dc-prod.yml build
	triton-compose -f env/dc-prod.yml up -d

clean:
	rm web/public/scripts/platform.js
	rm web/public/scripts/platform.min.js
	rm web/public/styles/vendor.css

$(CERTS):
	cd $(CERTDIR) && mkcert $(DEVHOST)
