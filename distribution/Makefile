IMAGE_NAME:=jenkins/evergreen
COMPOSE:=../tools/compose
DOWNLOAD=curl -sSL
# This variable is used for downloading some of the "upstream" maintained
# scripts necessary for running Jenkins nicely inside of Docker
SCRIPTS_URL=https://raw.githubusercontent.com/jenkinsci/docker/master/

### Phony targets
#################
all: check container

lint: shunit2
	../tools/yamllint -s config/as-code/*.yaml
	../tools/shellcheck -x tests/tests.sh
	$(MAKE) -C environments lint

check: lint
	$(MAKE) -C client $@
	$(MAKE) container-check

fix-formatting:
	$(MAKE) -C client $@

container-prereqs: build/jenkins-support build/jenkins.sh

container-check-prereqs: shunit2 ./tests/tests.sh ./tests/offline-tests.sh
	$(MAKE) -C ../services dump

container-check: base-container-check docker-cloud-container-check

base-container-check: containers container-check-prereqs
	./tests/offline-tests.sh
	./tests/tests.sh

docker-cloud-container-check: containers container-check-prereqs
	ENVIRONMENT=docker-cloud ./tests/offline-tests.sh
	ENVIRONMENT=docker-cloud ./tests/tests.sh

container: container-prereqs Dockerfile config/supervisord.conf
	$(MAKE) -C client unit
	docker build -t ${IMAGE_NAME}:latest .
	$(MAKE) -C environments $@

containers: container
	$(MAKE) -C ../services container

publish: container
	docker push ${IMAGE_NAME}:latest
	$(MAKE) -C environments $@

run:
	$(COMPOSE) up

clean:
	$(COMPOSE) down || true
	docker rmi $$(docker images -q -f "reference=$(IMAGE_NAME)") || true
	$(MAKE) -C client $@
	$(MAKE) -C ../services $@
	rm -f build/docker-compose
	rm -rf build/configuration-as-code/target
	rm -rf build/essentials/target

#################

build/jenkins.sh:
	mkdir -p build
	$(DOWNLOAD)  $(SCRIPTS_URL)/jenkins.sh > $@
	chmod +x $@

build/jenkins-support:
	mkdir -p build
	$(DOWNLOAD) $(SCRIPTS_URL)/jenkins-support > $@
	chmod +x $@

shunit2:
	git clone --depth 1 https://github.com/kward/shunit2

.PHONY: all check clean container container-check container-prereqs container-check-prereqs base-container-check docker-cloud-container-check
