#!/bin/sh
# This script runs inside a docker container

echo -ne "\n\n===========================================================================\n\n"

loop_run () {
    NAME="$1"
    shift

    CMD="$1"
    shift

    while true; do
        echo "Starting $NAME ($CMD $@)"

        "$CMD" "$@"

        echo "$NAME finished. Restarting after a delay."
        sleep 5
    done
}


# Need to copy klipper because it compiles something and lacks permissions
cp -r /opt/klipper /tmp/

# Run

export PYTHONPATH=/opt/simulavr/build/pysimulavr
loop_run "Klipper simulavr" /tmp/klipper/scripts/avrsim.py -m atmega644 -s 20000000 -b 250000 /tmp/klipper/out/klipper.elf &

sleep 2

loop_run "Klipper" /tmp/klipper/.venv/bin/python /tmp/klipper/klippy/klippy.py /klipper.cfg -a /tmp/shared/klippy_uds &

sleep 5

mkdir -p /tmp/shared/octoprint
loop_run "Octoprint" /opt/octoprint/.venv/bin/octoprint serve --basedir /tmp/shared/octoprint --config /tmp/shared/octoprint/config.yaml --port 8080