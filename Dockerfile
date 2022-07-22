FROM jarredsumner/bun:edge AS runner

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

RUN sed -i 's/"prepare": "husky install"/"prepare": ""/' ./package.json \
    && bun install

COPY . .

ENV NODE_ENV production

USER sneedex

EXPOSE 3000

CMD ["bun", "run", "start"]
