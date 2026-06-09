import { test as base, APIRequestContext } from "@playwright/test";
import { AuthApiClient } from "../commands/api/auth.api.client";
import { CommandsApiClient } from "../commands/api/commands.api.client";
import { isCommandsConfigured } from "../commands/config/env.config";
import { TokenManager } from "../core/utils/token-manager";

type CommandsFixtures = {
  commandsClient: CommandsApiClient;
  operatorClient: CommandsApiClient;
  viewerClient: CommandsApiClient;
  consumerClient: CommandsApiClient;
  authClient: AuthApiClient;
  unauthenticatedClient: CommandsApiClient;
};

async function createAuthenticatedClient(
  request: APIRequestContext,
  loginFn: (auth: AuthApiClient) => Promise<{ accessToken: string }>
): Promise<CommandsApiClient> {
  const auth = new AuthApiClient(request);
  const session = await loginFn(auth);
  const client = new CommandsApiClient(request);
  client.setToken(session.accessToken);
  return client;
}

export { isCommandsConfigured };

export const test = base.extend<CommandsFixtures>({
  commandsClient: async ({ request }, use, testInfo) => {
    if (!isCommandsConfigured()) {
      testInfo.skip(true, "Commands API not configured — set COMMANDS_ENABLED=true");
      return;
    }

    try {
      const token = await TokenManager.getToken();
      const client = new CommandsApiClient(request);
      client.setToken(token);
      await use(client);
    } catch {
      testInfo.skip(true, "Auth token unavailable — run global setup first");
    }
  },

  operatorClient: async ({ request }, use, testInfo) => {
    if (!isCommandsConfigured() || !process.env.OPERATOR_EMAIL) {
      testInfo.skip(true, "OPERATOR_EMAIL not configured");
      return;
    }
    const client = await createAuthenticatedClient(request, (a) => a.loginAsOperator());
    await use(client);
  },

  viewerClient: async ({ request }, use, testInfo) => {
    if (!isCommandsConfigured() || !process.env.VIEWER_EMAIL) {
      testInfo.skip(true, "VIEWER_EMAIL not configured");
      return;
    }
    const client = await createAuthenticatedClient(request, (a) => a.loginAsViewer());
    await use(client);
  },

  consumerClient: async ({ request }, use, testInfo) => {
    if (!isCommandsConfigured() || !process.env.CONSUMER_EMAIL) {
      testInfo.skip(true, "CONSUMER_EMAIL not configured");
      return;
    }
    const client = await createAuthenticatedClient(request, (a) => a.loginAsConsumer());
    await use(client);
  },

  authClient: async ({ request }, use) => {
    await use(new AuthApiClient(request));
  },

  unauthenticatedClient: async ({ request }, use) => {
    await use(new CommandsApiClient(request));
  }
});

export { expect } from "@playwright/test";
