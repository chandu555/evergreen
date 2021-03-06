FROM openjdk:8u171-jre-alpine3.8

ARG user=jenkins
ARG group=jenkins
ARG uid=1000
ARG gid=1000
ARG http_port=8080
ARG agent_port=50000

ENV EVERGREEN_ENDPOINT=http://127.0.0.1:3030/
ENV EVERGREEN_HOME /evergreen

ENV JENKINS_HOME ${EVERGREEN_HOME}/jenkins/home
ENV JENKINS_WAR ${JENKINS_HOME}/jenkins.war
ENV JENKINS_VAR ${EVERGREEN_HOME}/jenkins/var
ENV JENKINS_AGENT_PORT ${agent_port}
ENV COPY_REFERENCE_FILE_LOG $JENKINS_HOME/copy_reference_file.log
ENV JENKINS_UC https://updates.jenkins.io
ENV JENKINS_UC_EXPERIMENTAL=https://updates.jenkins.io/experimental

ENV JAVA_OPTS=\
"-Djava.awt.headless=true "\
"-Djenkins.model.Jenkins.workspacesDir=${JENKINS_VAR}/jobs/\${ITEM_FULL_NAME}/workspace "\
"-Djenkins.model.Jenkins.buildsDir=${JENKINS_VAR}/jobs/\${ITEM_FULL_NAME}/builds "\
"-Dhudson.triggers.SafeTimerTask.logsTargetDir=$JENKINS_VAR/logs "\
"-Djava.util.logging.config.file=$EVERGREEN_HOME/logging.properties "

ENV JENKINS_OPTS=\
"--webroot=${JENKINS_VAR}/war "\
"--pluginroot=${JENKINS_VAR}/plugins"

RUN mkdir -p /usr/share/jenkins/ref/ && \
    mkdir ${EVERGREEN_HOME} && \
    mkdir ${EVERGREEN_HOME}/jenkins/ && \
    mkdir ${JENKINS_HOME} && \
    mkdir ${JENKINS_VAR} && \
    mkdir ${JENKINS_VAR}/logs

# for main web interface:
EXPOSE ${http_port}
# will be used by attached agents:
EXPOSE ${agent_port}

# Add the system dependencies for running Jenkins effectively
#
# The only dependencies for Jenkins Essentials are:
#   * supervisor
#   * nodejs
RUN apk add --no-cache git \
                        ca-certificates \
                        openssh-client \
                        unzip \
                        bash \
                        supervisor \
                        nodejs \
                        nodejs-npm \
                        ttf-dejavu \
                        curl \
                        socat

# TODO: add a checksum check?
RUN cd /tmp && \
    wget --quiet https://download.docker.com/linux/static/stable/x86_64/docker-17.12.1-ce.tgz --output-document /tmp/docker.tar.gz && \
    tar xvzf docker.tar.gz && \
    mv docker/* /usr/local/bin && \
    rmdir docker && \
    rm docker.tar.gz

COPY config/logging.properties $EVERGREEN_HOME/logging.properties

# Jenkins is run with user `jenkins`, uid = 1000
# If you bind mount a volume from the host or a data container,
# ensure you use the same uid
RUN addgroup -g ${gid} ${group} \
    && adduser -h "$JENKINS_HOME" -u ${uid} -G ${group} -s /bin/bash -D ${user}


# Ensure that only the right CA root certificates are present on the system
# See JEP-307
COPY scripts/generate-ca-certificates /usr/local/sbin/
RUN /usr/local/sbin/generate-ca-certificates

#######################
## Construct the image
#######################

RUN mkdir -p /usr/local/bin
COPY build/jenkins.sh /usr/local/bin/
COPY build/jenkins-support /usr/local/bin/

# FIXME (?): what if the end users touches the config value?
# as is, we'll override it.
COPY config/as-code/ /usr/share/jenkins/ref/configuration/
ENV CASC_JENKINS_CONFIG=$JENKINS_HOME/configuration/

# Ensure the supervisord configuration is copied and executed by default such
# that the Jenkins and evergreen-client processes both execute properly
COPY config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
CMD /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

WORKDIR $EVERGREEN_HOME

RUN time chown -R $user:$group $EVERGREEN_HOME
USER $user

# Prepare the evergreen-client configuration
# Sigh https://github.com/moby/moby/issues/35018, cannot use $user below
COPY --chown=jenkins:jenkins client ${EVERGREEN_HOME}/client

# Even if empty, the file needs to exist as we use at least for now https://github.com/lucagrulla/node-tail
# which immediately crashes if the file is missing, even if we use the `follow` switch
RUN touch ${JENKINS_VAR}/logs/essentials.log.0

# Jenkins directory is a volume, so configuration and build history
# can be persisted and survive image upgrades
# Important: this must be done *after* the chown

VOLUME ${EVERGREEN_HOME}

USER root
