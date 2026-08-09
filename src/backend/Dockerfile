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
RUN clojure -P -M:run

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
