FROM debian:latest as runner

WORKDIR /app

ENV GROUP=bun
ENV USER=sneedex
ENV UID=1001
ENV GID=1001

RUN addgroup \
  --system \
  --gid "${GID}" \
  "${GROUP}" \
  && adduser \
  --system \
  --disabled-password \
  --gecos "" \
  --home "/nonexistent" \
  --shell "/sbin/nologin" \
  --no-create-home \
  --uid "${UID}" \
  "${USER}"

COPY package.json bun.lockb ./

RUN apt-get update && apt-get install -y curl unzip

RUN curl https://bun.sh/install | bash
RUN $HOME/.bun/bin/bun install
RUN cp $HOME/.bun/bin/bun /bin

COPY . .

ENV NODE_ENV production

USER sneedex

EXPOSE 3000

CMD ["bun", "run", "start"]
