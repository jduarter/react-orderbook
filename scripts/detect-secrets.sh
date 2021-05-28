#!/bin/sh

find . -type f \( \! -path './node_modules*' -and \! -path './policy.json' -and \! -path './package.json' -and \! -path './package-lock.json' -and \! -path './\.git*' \) |egrep '.*\.((j|t)sx?|\.env|\.plist|\.xml|\.m|\.h|\.mm?)'|xargs npx detect-secrets-hook --baseline .secrets.baseline
