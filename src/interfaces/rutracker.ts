export interface IRutrackerData {
  result: {
    [id: number]: {
      info_hash: string
      forum_id: number
      poster_id: number
      size: number
      reg_time: number
      tor_status: number
      seeders: number
      topic_title: string
      seeder_last_seen: number
      dl_count: number
    }
  }
}
