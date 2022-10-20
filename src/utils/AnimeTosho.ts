import { TOSHO_URL } from '#/constants'
import { ToshoData } from '#interfaces/AnimeTosho'
import { Data } from '#interfaces/Data'
import { Provider } from '#interfaces/Provider'

export class AnimeTosho implements Provider {
  // provider specific fetch function to retrieve raw data
  private async fetch(query: string): ToshoData[] {
    const data = await fetch(
      `${TOSHO_URL}?t=search&extended=1&limit=100&offset=0&q=${encodeURIComponent(
        query
      )}`
    ).then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })

    return data
  }

  // get function to standardize the returned data to make things easier to work with and plug-and-play
  public async get(query: string): Data[] {
    // shrimply fetch the data and then map it to the appropriate values
    const data = await this.fetch(query)
    return data.map(entry => ({
      title: entry.title,
      url: entry.nzb_url || entry.torrent_url,
      type: entry.nzb_url ? 'usenet' : 'torrent'
    }))
  }
}
