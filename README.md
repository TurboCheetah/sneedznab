# Sneedznab

## Running with Docker

**Keys to collect**
*note there is no API key for the indexer itself, as this project is intended to run on an internal Docker network, without ports being expoesd to the internet*

- [AnimeBytes](https://animebytes.tv/user.php?action=edit) - for AnimeBytes results // only required if you are using AnimeBytes
- If you are using Redis as your cache, you can retrieve the `REDIS_URL` and `REDIS_TOKEN` keys from [Upstash](https://console.upstash.com)

Clone the repository or fetch it however you want:

```sh
git clone https://github.com/TurboCheetah/sneedznab.git
cd sneedznab
```

Edit the environment variables in `docker-compose.yml` to suit your needs.

Finally, spin up a Docker container using `docker-compose up -d`.

## Explaination of environment variables

- `<PROVIDER>_ENABLED`: when set to true Sneedznab will search this provider for the requested anime
- `ANIMEBYTES_PASSKEY`: your AnimeBytes passkey. Only required if `ANIMEBYTES_ENABLED` is set to `true`. See above for where to obtain it
- `ANIMEBYTES_USERNAME`: your AnimeBytes usersname. Only required if `ANIMEBYTES_ENABLED` is set to `true`. This is required for interacting with their API
- `REDIS_ENABLED`: determines whether or not to use Redis as the cache provider instead of a local in-memory cache
- `REDIS_URL`: the URL to the Redis database hosted by Upstash. Only required if `REDIS_ENABLED` is set to `true`. See above for where to obtain it
- `REDIS_TOKEN`: the token used to access the Redis database. Only required if `REDIS_ENABLED` is set to `true`
- `CACHE_TTL`: how long a cached entry should live in the cache for
- `DEBUG`: toggles verbose logging

## Segmentation Faults

Due to its instability, Bun may segfault after performing a search. From my testing this only has a chance of occuring on the first search. If you encounter this, just restart the container and perform a test search until it doesn't segfault.
