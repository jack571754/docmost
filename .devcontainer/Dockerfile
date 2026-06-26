FROM node:22-bookworm

# 构建阶段强制清空代理变量，避免宿主机代理(127.0.0.1:7897 等)被注入导致连接被拒
# 同时设置 npm 赦走国内镜像源
ENV HTTP_PROXY="" \
    HTTPS_PROXY="" \
    http_proxy="" \
    https_proxy="" \
    NO_PROXY="*" \
    no_proxy="*" \
    NPM_CONFIG_REGISTRY="https://registry.npmmirror.com"

RUN npm config set registry https://registry.npmmirror.com \
    && npm config delete proxy \
    && npm config delete https-proxy

# 固定 pnpm 10.4.0（直连 npmmirror，不走代理）
# BuildKit 会自动把宿主机代理作为预定义 build-arg 注入（HTTP_PROXY 等），优先级高于 ENV，
# 因此必须在此 RUN 的 shell 里显式 unset，并强制 --registry + --noproxy 直连国内镜像。
RUN unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy \
    && npm install -g pnpm@10.4.0 \
        --registry=https://registry.npmmirror.com \
        --noproxy=*

# 使用非 root 用户
USER node

WORKDIR /workspace
