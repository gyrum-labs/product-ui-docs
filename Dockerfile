# product-ui-docs — production container image (backend).
#
# This is a stub — the operator fills in the real backend build below.
# The release.yml workflow will publish whatever image this Dockerfile
# produces to ghcr.io/gyrum-labs/product-ui-docs:<tag>.
#
# When you implement the real build, keep these contracts so the rest
# of the fleet keeps working:
#   * Two-stage (builder + runtime). Distroless runtime preferred.
#   * CGO_ENABLED=0 GOOS=linux GOARCH=amd64 for Go builds.
#   * Accept the build-identity ARGs below and inject them into the
#     binary so /api/version reports real values.
#   * EXPOSE the backend port (default 8080 in the docker-compose.yml).
#   * USER nonroot (or a numeric uid) — never run as root.
#
# Reference implementations:
#   warp/Dockerfile          — Go + distroless static
#   distill-gyrum-ai/Dockerfile — Go + distroless static
#
# Build-identity args (the release workflow passes these on every push):
ARG COMMIT=unknown
ARG BRANCH=unknown
ARG BUILD_TIME=unknown
ARG VERSION_TAG=unknown

FROM alpine:latest

LABEL org.opencontainers.image.title="product-ui-docs"
LABEL org.opencontainers.image.source="https://github.com/gyrum-labs/product-ui-docs"

CMD ["echo", "TODO: implement product-ui-docs backend — see Dockerfile header for the contract."]
