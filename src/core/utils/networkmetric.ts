import https from "https";
import http from "http";
import { performance } from "perf_hooks";
export interface NetworkMetricsResult {
    dns: number;
    connection: number;

}
export class NetworkMetrics {
    static async capture(
        url: string
    ): Promise<NetworkMetricsResult> {
        return new Promise((resolve, reject) => {
            let dnsStart = 0;
            let dnsEnd = 0;
            let connectionStart = 0;
            let connectionEnd = 0;
            const protocol =
                url.startsWith("https")
                    ? https
                    : http;
            const req =
                protocol.request(
                    url,
                    {
                        method: "HEAD"
                    },
                    () => {
                        resolve({
                            dns:
                                Number(
                                    (dnsEnd - dnsStart)
                                        .toFixed(2)
                                ),
                            connection:
                                Number(
                                    (
                                        connectionEnd -
                                        connectionStart
                                    ).toFixed(2)
                                )
                        });
                        req.destroy();
                    }
                );
            req.on(
                "socket",
                (socket) => {
                    dnsStart =
                        performance.now();
                    socket.on(
                        "lookup",
                        () => {
                            dnsEnd =
                                performance.now();
                            connectionStart =
                                performance.now();
                        });
                    socket.on(
                        "connect",
                        () => {
                            connectionEnd =
                                performance.now();
                        });
                });
            req.on(
                "error",
                (err) => {
                    reject(err);
                });
            req.end();
        });
    }
}