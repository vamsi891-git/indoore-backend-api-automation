export interface AlarmsEventsDashboardData {
  power: number;
  current: number;
  voltage: number;
  transaction: number;
  other: number;
  nonRolloverControl: number;
}

export interface AlarmsEventsDashboardResponse {
  success:boolean;
  data ?:AlarmsEventsDashboardData;
  error?: {code?:string;message?:string};
}
export class AlarmsEventsDashboardMapper {
  static map(response:AlarmsEventsDashboardResponse):AlarmsEventsDashboardData {
    const data = response.data ?? ({}as AlarmsEventsDashboardData);
    return {
      power:Number(data.power ?? 0),
      current:Number(data.current ?? 0),
      voltage:Number(data.voltage ?? 0),
      transaction:Number(data.transaction ?? 0),
      other:Number(data.other ?? 0),
      nonRolloverControl:Number(data.nonRolloverControl ?? 0),
    };
  }
}
