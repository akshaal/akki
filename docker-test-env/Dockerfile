ARG ALPINE_VERSION
FROM alpine:${ALPINE_VERSION}

RUN mkdir -p /opt

# -----------------------------------------------------------------------------------
# SIMULAVR

RUN apk add git autoconf automake gcc libtool python3 python3-dev binutils \
            build-base swig texinfo python2 python2-dev py-virtualenv libffi-dev gcc-avr avr-libc \
            g++ make cmake binutils-dev tcl-dev

ARG SIMULAVR_TAG
RUN echo "========= SIMULAVR ${SIMULAVR_TAG}"
WORKDIR /opt
RUN git clone "git://git.savannah.nongnu.org/simulavr.git"
WORKDIR /opt/simulavr
RUN git -c advice.detachedHead=false checkout "${SIMULAVR_TAG}"
RUN make python
RUN make build

# -----------------------------------------------------------------------------------
# Klipper

ARG KLIPPER_TAG
WORKDIR /opt
RUN echo "========= Klipper ${KLIPPER_TAG}"
RUN git clone "https://github.com/KevinOConnor/klipper"
WORKDIR /opt/klipper
RUN mkdir -p .venv
RUN git -c advice.detachedHead=false checkout "${KLIPPER_TAG}"
RUN virtualenv /opt/klipper/.venv -p python2
RUN /opt/klipper/.venv/bin/pip install -r /opt/klipper/scripts/klippy-requirements.txt
COPY ./klipper-menuconfig-result /opt/klipper/.config
RUN make

# -----------------------------------------------------------------------------------
# Octoprint

ARG OCTOPRINT_TAG
WORKDIR /opt
RUN echo "========= Octoprint ${OCTOPRINT_TAG}"
RUN git clone "https://github.com/foosel/OctoPrint.git" octoprint
WORKDIR /opt/octoprint
RUN mkdir -p .venv
RUN git -c advice.detachedHead=false checkout "${OCTOPRINT_TAG}"
RUN virtualenv /opt/octoprint/.venv -p python3
RUN /opt/octoprint/.venv/bin/pip install /opt/octoprint

# -----------------------------------------------------------------------------------

COPY ./klipper.cfg /klipper.cfg

COPY ./run-in-docker.sh /run.sh
RUN chmod 755 /run.sh

RUN mkdir /tmp/shared

CMD [ "/run.sh" ]
