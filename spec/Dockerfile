# Smithy code generation image.
# The Smithy CLI distribution bundles its own Java runtime, so no JDK is needed.
# Usage (from repo root): docker compose --profile tools run --rm codegen
FROM debian:bookworm-slim

ARG SMITHY_VERSION=1.71.0
ARG TARGETARCH

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl unzip nodejs \
 && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    case "${TARGETARCH}" in \
      amd64) ARCH=x86_64 ;; \
      arm64) ARCH=aarch64 ;; \
      *) echo "unsupported arch ${TARGETARCH}" && exit 1 ;; \
    esac; \
    curl -fsSL -o /tmp/smithy.zip "https://github.com/smithy-lang/smithy/releases/download/${SMITHY_VERSION}/smithy-cli-linux-${ARCH}.zip"; \
    cd /tmp && unzip -q smithy.zip && "./smithy-cli-linux-${ARCH}/install" && rm -rf /tmp/smithy*; \
    smithy --version

WORKDIR /work/spec
# Maven dependencies are cached in this volume across runs (see docker-compose.yml).
ENV SMITHY_MAVEN_CACHE=/root/.m2
ENTRYPOINT ["sh", "-c", "smithy clean && smithy build && node /work/spec/scripts/sync-generated.mjs"]
