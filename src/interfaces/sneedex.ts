export interface ISneedexData {
  confidence: number
  uuid: string
  title: string
  alias: string
  notes: string
  comparisons: string
  releases: {
    uuid: string
    type: string
    best: string
    alt: string
    best_links: string
    alt_links: string
    best_dual: boolean
    alt_dual: boolean
    best_incomplete: boolean
    alt_incomplete: boolean
    best_unmuxed: boolean
    alt_unmuxed: boolean
    best_bad_encode: boolean
    alt_bad_encode: boolean
  }[]
}
