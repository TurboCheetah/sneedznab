import { Data } from '#interfaces/Data'

export interface Provider {
  fetch(): any
  get(): Data[]
}
