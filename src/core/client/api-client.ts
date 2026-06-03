// ==========================================
// FILE: src/core/client/apiClient.ts
// ==========================================

import { request, APIRequestContext} from '@playwright/test';

import { TokenManager } from '../utils/token-manager';
export class ApiClient {

  private apiContext!: APIRequestContext;

  async init() {

    this.apiContext =
      await request.newContext({

        baseURL: process.env.BASE_URL,

        extraHTTPHeaders: {

          'Content-Type': 'application/json',

          Authorization:
            `Bearer ${TokenManager.getToken()}`
        }
      });
  }

  get client(): APIRequestContext {
    return this.apiContext;
  }
}