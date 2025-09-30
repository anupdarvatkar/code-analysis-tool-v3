
export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

export interface PackageDetail {
  name: string;
  classes: string[];
}

export interface PackageData {
  name:string;
  count: number;
  details: PackageDetail;
}

export interface ChartData {
  name: string;
  value: number;
}
