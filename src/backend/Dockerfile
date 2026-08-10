# Deployment-only file — does not modify any application source.
#
# Runs the existing `clojure -M:run` entrypoint (see deps.edn / main.clj)
# inside a container. Dependencies are resolved once at image build time
# (via `clojure -P`) so the container doesn't need network access to
# Maven/Clojars/GitHub at boot.
#
# Build context must be src/backend/ (see ../render.yaml: dockerContext).

FROM clojure:temurin-21-tools-deps-noble AS deps
WORKDIR /app
# Copy only dependency-manifest first so this layer caches independently
# of source changes.
COPY deps.edn /app/deps.edn
# `clojure -P` only creates /root/.gitlibs when deps.edn has :git/url
# coordinates. This project's deps.edn currently uses :mvn/version only,
# so that directory would never exist and the COPY below would fail the
# build unconditionally. `mkdir -p` guarantees it exists (empty, if there
# are no git deps; populated, if any are added later) so the COPY always
# succeeds either way.
RUN clojure -P -M:run && mkdir -p /root/.gitlibs

FROM clojure:temurin-21-tools-deps-noble
WORKDIR /app

# Run as a non-root user.
RUN useradd --create-home --shell /bin/bash appuser
COPY --from=deps /root/.m2 /home/appuser/.m2
COPY --from=deps /root/.gitlibs /home/appuser/.gitlibs
COPY --from=deps /root/.clojure /home/appuser/.clojure

COPY . /app
RUN chown -R appuser:appuser /app /home/appuser
USER appuser
ENV HOME=/home/appuser

# Render (and most PaaS hosts) inject $PORT; resources/config.edn already
# reads it via #env PORT with a fallback to 3000, so no source change is
# needed — just make sure PORT is set in the host's env config.
EXPOSE 3000

CMD ["clojure", "-M:run"]
