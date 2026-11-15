#!/bin/bash
# Esegue un comando e, se fallisce, scrive gli errori come annotazioni leggibili dall'API
n="$1"; shift
"$@" > "/tmp/$n.log" 2>&1; c=$?
tail -n 60 "/tmp/$n.log"
if [ $c -ne 0 ]; then
  echo "::error title=$n-errori::$(grep -nE 'error|Error|FAILED|wrong|Could not|^e: |Caused by|Exception' /tmp/$n.log | grep -v 'Io(Env' | cut -c1-300 | head -40 | sed ':a;N;$!ba;s/\n/%0A/g')"
fi
exit $c
