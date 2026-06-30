FROM oven/bun:1-slim

RUN apt-get update && apt-get install -y curl socat && rm -rf /var/lib/apt/lists/*

RUN bun install -g github:garrytan/gbrain

VOLUME /root/.gbrain

EXPOSE 3002

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
