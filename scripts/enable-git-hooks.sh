#!/bin/sh

set -e

git config core.hooksPath .githooks
printf '%s\n' '已启用项目素材提交检查。'
