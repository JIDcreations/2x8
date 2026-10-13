#!/usr/bin/env bash
# Rooktest: routing, redirects, filter en demo-beveiliging. Werkt lokaal en live.
#   lokaal:  bash tools/rooktest.sh http://localhost:8048/brug48
#   live:    bash tools/rooktest.sh https://2x8.be/brug48 brug48:<wachtwoord>
B=${1:?basis-URL ontbreekt}; AUTH=${2:+-u $2}; fout=0
code() { curl -s $AUTH -o /dev/null -w '%{http_code}' "$B$1"; }
plek() { curl -s $AUTH -o /dev/null -w '%{redirect_url}' "$B$1" | sed 's#^https\?://[^/]*##'; }  # enkel het pad
check() { if [ "$2" = "$3" ]; then echo "ok    $1"; else echo "FOUT  $1: verwacht '$3', kreeg '$2'"; fout=1; fi; }

check "home"                    "$(code /)" 200
check "overzicht"               "$(code /therapeuten)" 200
check "detail bestaat"          "$(code /therapeuten/katrien-boone)" 200
check "onbekende pagina"        "$(code /bestaat-niet)" 404
check "slash op het einde"      "$(plek /therapeuten/)" "$(echo "$B" | sed 's#^https\?://[^/]*##')/therapeuten"
check "dubbele slash blijft hier" "$(plek //voorbeeld.com/ | grep -c '//voorbeeld.com')" 0
check "lege filterparameter"    "$(code '/therapeuten?thema=&doelgroep=koppels')" 301
check "filter angst = 9"        "$(curl -s $AUTH "$B/therapeuten?thema=angst" | grep -o 'class="teller">[0-9]*' | grep -o '[0-9]*$')" 9
check "lege toestand = 0"       "$(curl -s $AUTH "$B/therapeuten?thema=verslaving&doelgroep=ouderen" | grep -o 'class="teller">[0-9]*' | grep -o '[0-9]*$')" 0
check "data afgeschermd"        "$(code /data/therapeuten.json)" "$(case $B in http://localhost*) echo 200;; *) echo 403;; esac)"
if [ -n "$AUTH" ]; then check "zonder wachtwoord" "$(curl -s -o /dev/null -w '%{http_code}' "$B/")" 401; fi
exit $fout
