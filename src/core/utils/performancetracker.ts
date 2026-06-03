import fs from "fs";
import path from "path";
import { APIResponse } from "@playwright/test";
import { NetworkMetrics }
    from "./networkmetric";
export class PerformanceTracker {
    private static resolveUrl(apiUrl: string, rawResponse: APIResponse): string {
        if (/^https?:\/\//i.test(apiUrl)) {
            return apiUrl;
        }

        const responseUrl = rawResponse.url();
        if (responseUrl) {
            return responseUrl;
        }

        const base = process.env.BASE_URL;
        if (!base) {
            throw new Error(
                "BASE_URL is required when tracking performance for a relative API path"
            );
        }

        return new URL(apiUrl, base).href;
    }

    static async track(
        rawResponse: APIResponse,
        apiName: string,
        apiUrl: string,
        responseTime: number
    ) {
        const body =
            await rawResponse.body();
        const sizeBytes =
            body.length;
        const metrics =
            await NetworkMetrics.capture(
                this.resolveUrl(apiUrl, rawResponse)
            );
        const download =
            Math.max(
                100,
                Math.floor(
                    sizeBytes / 50000
                )
            );
        const serverProcessing =
            responseTime -
            metrics.dns -
            metrics.connection -
            download;
        const report = `
==================================
API : ${apiName}
DNS : ${metrics.dns} ms
Connection : ${metrics.connection} ms
Server Processing : ${serverProcessing} ms
Download : ${download} ms
Total : ${responseTime} ms
===================================
`;
        console.log(report);
        this.save(report);
    }
    static save(
        report: string
    ) {
        const folder =
            "./reports/performance";
        if (
            !fs.existsSync(folder)
        ) {
            fs.mkdirSync(
                folder,
                {
                    recursive: true
                }
            );
        }
        const file =
            path.join(
                folder,
                `${process.env.TEST_TYPE || "run"}.txt`
            );
        fs.appendFileSync(
            file,
            report
        );
    }
}