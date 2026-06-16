export interface MeterAlarmRow {
  meterId: string;
  meterAlarmId: number;
  sequenceNumber: number;
  alarmTime: string;
  alarmActive: string[];
  createTime: string;
}

export interface MeterAlarmsResponse {
  success: boolean;
  data?: MeterAlarmRow[];
  error?: { code?: string; message?: string };
}

export interface MappedMeterAlarmsData {
  alarms: MeterAlarmRow[];
}

export class CommandsMeterAlarmsMapper {
  static mapResponse(body: MeterAlarmsResponse): MappedMeterAlarmsData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful meter-alarms response");
    }

    return {
      alarms: body.data.map((alarm) => ({
        meterId: alarm.meterId.trim(),
        meterAlarmId: alarm.meterAlarmId,
        sequenceNumber: alarm.sequenceNumber,
        alarmTime: alarm.alarmTime.trim(),
        alarmActive: alarm.alarmActive.map((code) => code.trim()),
        createTime: alarm.createTime.trim(),
      })),
    };
  }
}
