#!/bin/sh
set -eu

export KIMI_API_KEY="$(security find-generic-password -a "$USER" -s '易得康内容审核.KIMI_API_KEY' -w)"
export KIMI_BASE_URL="https://api.kimi.com/coding/v1"

exec npm run dev
