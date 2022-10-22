import { IData } from '#interfaces/provider'

export interface ICache {
  set(key: string, value: IData[]): Promise<void>
  get(key: string): Promise<IData[]>
}
