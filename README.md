# Sneedex-Indexer

## Running with Docker

**Keys to collect**
*note there is no API key for the indexer itself, as this project is intended to run on an internal Docker network, without ports being expoesd to the internet*

- [Sneedex](https://sneedex.moe/options) - for Sneedex searches
- [AnimeBytes](https://animebytes.tv/user.php?action=edit) - for AnimeBytes results // only required if you are using AnimeBytes
- If you are using Redis as your cache, you can retrieve the `REDIS_URL` and `REDIS_TOKEN` keys from [Upstash](https://console.upstash.com)

Clone the repository or fetch it however you want:

```sh
git clone https://github.com/TurboCheetah/sneedex-indexer.git
cd sneedex-indexer
```

Copy `.env.example` to `.env` and put the appropriate API keys in there.

Finally, spin up a Docker container using `docker-compose up -d`.

## Segmentation Faults

Due to its instability, Bun may segfault after performing a search. From my testing this only has a chance of occuring on the first search. If you encounter this, just restart the container and perform a test search until it doesn't segfault.
