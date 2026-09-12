import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { TokenManager } from "../../../core/utils/token-manager";
import { NotificationsApi } from "../Api/notifications.api";
import { NotificationsData } from "../Data/notifications.data";
import { NotificationsMapper } from "../Mapper/notifications.mapper";
import {
  getNotificationByIdForUser,
  getNotificationStatsForUser,
} from "../Db/notifications.db";
import {
  compareNotificationSpotToDb,
  compareNotificationStatsToDb,
  compareNotificationsCountLteDb,
} from "../Db/notifications-db-compare";
import { logNotificationsDataQualityFindings } from "../Db/notifications-db.validator";

/**
 * Part 4 harness — inbox stats + list total + optional row spot
 * vs general.user_notifications for the JWT user.
 */
export async function runNotificationsDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const api = new NotificationsApi(authenticatedApi);
  const userId = NotificationsMapper.getUserIdFromAccessToken(
    await TokenManager.getToken(),
  );

  const listResult = await api.getNotifications(
    NotificationsData.page,
    NotificationsData.limit,
  );
  expect(listResult.rawResponse.status()).toBe(200);
  const listMapped = NotificationsMapper.mapNotificationsList(
    listResult.responseBody,
  );
  await logNotificationsDataQualityFindings(
    "list",
    listResult.responseBody.data as unknown as Record<string, unknown>,
  );

  const statsResult = await api.getNotificationStats();
  expect(statsResult.rawResponse.status()).toBe(200);
  const statsMapped = NotificationsMapper.mapStats(statsResult.responseBody);
  const dbStats = await getNotificationStatsForUser(db, userId);

  validation.execute("Notification stats vs DB (exact)", () => {
    compareNotificationStatsToDb({ api: statsMapped, db: dbStats });
  });

  validation.execute("Notification list total equals stats/DB total", () => {
    compareNotificationsCountLteDb({
      label: "notifications.list.total",
      apiCount: listMapped.total,
      dbCount: dbStats.total,
    });
    expect(listMapped.total).toBe(dbStats.total);
  });

  const spot = listMapped.notifications[0];
  if (!spot?.id) {
    console.warn(
      "[BACKEND FINDING] notification spot skipped — inbox empty for JWT user",
    );
  } else {
    const dbRow = await getNotificationByIdForUser(db, spot.id, userId);
    validation.execute(`Notification spot vs DB (${spot.id})`, () => {
      compareNotificationSpotToDb({
        api: {
          id: spot.id,
          title: spot.title,
          isRead: spot.isRead,
          notificationType: spot.notificationType,
        },
        dbRow,
      });
    });
  }

  validation.printSummary("NOTIFICATIONS DB Coverage", 0);
}
