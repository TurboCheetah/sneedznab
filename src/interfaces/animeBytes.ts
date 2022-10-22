export interface IAnimeBytesData {
  Matches: number
  Limit: number
  Results: string
  Groups: {
    ID: number
    CategoryName: string
    FullName: string
    GroupsName: string
    SeriesID: string
    SeriesName: string
    Artists: null
    Year: string
    Image: string
    Synonyms: string[]
    Snacthed: number
    Comments: number
    Links: {
      AniDB: string
      ANN: string
      Wikipedia: string
      MAL: string
    }
    Votes: number
    AvgVote: number
    Associations: null
    Description: string
    DescriptionHTML: string
    EpCount: number
    StudioList: string
    PastWeek: number
    Incomplete: boolean
    Ongoing: boolean
    Tags: string[]
    Torrents: {
      ID: number
      EditionData: {
        EditionTitle: string
      }
      RawDownMultiplier: number
      RawUpMultiplier: number
      Link: string
      Property: string
      Snacthed: number
      Seeders: number
      Leechers: number
      Size: number
      FileCount: number
      FileList: string[]
      UploadTime: string
    }[]
  }[]
}
