FROM oven/bun:0.8.1 as runner

WORKDIR /app

ENV GROUP=bun
ENV USER=sneedex
ENV UID=1001

RUN adduser \
  --system \
  --disabled-password \
  --gecos "" \
  --home "/nonexistent" \
  --shell "/sbin/nologin" \
  --no-create-home \
  --uid "${UID}" \
  "${USER}"

COPY package.json bun.lockb ./

RUN bun install

COPY . .

ENV NODE_ENV production

USER sneedex

EXPOSE 3000

CMD ["bun", "run", "start"]
