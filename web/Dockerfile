# product-ui-docs-ui — production container image (frontend).
#
# Stub — the operator fills in the real frontend build below. The
# release.yml workflow publishes this image to
# ghcr.io/gyrum-labs/product-ui-docs-ui:<tag>.
#
# Per ADR-092 rule 1: every project ships exactly two images. Even a
# backend-only project carries this minimal nginx image so the host's
# Caddy reverse-proxy has a UI container to forward / to. Replace the
# placeholder index.html with your real SPA build output (typically
# `npm run build` of a SvelteKit / Vite tree) when you wire the UI.
#
# Reference implementations:
#   warp/web/Dockerfile  — node builder + nginx:alpine + SPA fallback
#
# Build-identity args (the release workflow passes these on every push):
ARG COMMIT=unknown
ARG BRANCH=unknown
ARG BUILD_TIME=unknown
ARG VERSION_TAG=unknown

FROM nginx:alpine

LABEL org.opencontainers.image.title="product-ui-docs-ui"
LABEL org.opencontainers.image.source="https://github.com/gyrum-labs/product-ui-docs"

ENV product-ui-docs_UI_COMMIT=${COMMIT} \
    product-ui-docs_UI_BRANCH=${BRANCH} \
    product-ui-docs_UI_BUILD_TIME=${BUILD_TIME} \
    product-ui-docs_UI_VERSION_TAG=${VERSION_TAG}

# Replace the stock nginx server config with one that does SPA fallback.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Drop the default index.html nginx ships with, then copy the static
# bundle in its place. The placeholder index.html below is what ships
# until the operator wires a real build pipeline.
RUN rm -rf /usr/share/nginx/html/* \
 && echo "${COMMIT} ${BRANCH} ${BUILD_TIME} ${VERSION_TAG}" \
        > /usr/share/nginx/html/version.txt
COPY index.html /usr/share/nginx/html/index.html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1
