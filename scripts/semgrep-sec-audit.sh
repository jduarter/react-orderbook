#!/bin/sh

docker run --rm -v "${PWD}:/src" returntocorp/semgrep --config=p/security-audit src/ --verbose
