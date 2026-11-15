#!/bin/bash
# Esegue un comando e, se fallisce, scrive l'errore come annotazione leggibile dall'API
n="$1"; shift
"$@" > "/tmp/$n.log" 2>&1; c=$?
tail -n 60 "/tmp/$n.log"
if [ $c -ne 0 ]; then echo "::error title=$n::$(tail -c 3500 /tmp/$n.log | sed ':a;N;$!ba;s/\n/%0A/g')"; fi
exit $c
