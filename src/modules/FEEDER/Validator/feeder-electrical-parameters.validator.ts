import { expect } from "@playwright/test";

export class FeederElectricalParametersValidator {

    validateFields(data: any): void {

        expect(data)
            .toHaveProperty("lastCommunication");

        expect(data)
            .toHaveProperty("meterSerialNumber");

        expect(data)
            .toHaveProperty("rPhase");

        expect(data)
            .toHaveProperty("yPhase");

        expect(data)
            .toHaveProperty("bPhase");
    }

    validatePhaseStructure(
        phase: any
    ): void {

        expect(phase)
            .toHaveProperty("voltage");

        expect(phase)
            .toHaveProperty("voltageUnit");

        expect(phase)
            .toHaveProperty("current");

        expect(phase)
            .toHaveProperty("currentUnit");
    }

    validateUnits(
        phase: any,
        voltageUnit: string,
        currentUnit: string
    ): void {

        expect(phase.voltageUnit)
            .toBe(voltageUnit);

        expect(phase.currentUnit)
            .toBe(currentUnit);
    }

    validateTypes(
        phase: any
    ): void {

        if (
            phase.voltage !== null
        ) {
            expect(
                typeof phase.voltage
            ).toBe("number");
        }

        if (
            phase.current !== null
        ) {
            expect(
                typeof phase.current
            ).toBe("number");
        }
    }

    validatePositiveValues(
        phase: any
    ): void {

        if (
            phase.voltage !== null
        ) {
            expect(
                phase.voltage
            ).toBeGreaterThanOrEqual(0);
        }

        if (
            phase.current !== null
        ) {
            expect(
                phase.current
            ).toBeGreaterThanOrEqual(0);
        }
    }

    validateNaN(
        phase: any
    ): void {

        if (
            phase.voltage !== null
        ) {
            expect(
                Number.isNaN(
                    phase.voltage
                )
            ).toBeFalsy();
        }

        if (
            phase.current !== null
        ) {
            expect(
                Number.isNaN(
                    phase.current
                )
            ).toBeFalsy();
        }
    }

    validateEmptyMeterLogic(
        data: any
    ): void {

        if (
            data.meterSerialNumber === null
        ) {

            [
                data.rPhase,
                data.yPhase,
                data.bPhase
            ]
                .forEach(
                    phase => {

                        expect(
                            phase.voltage
                        ).toBeNull();

                        expect(
                            phase.current
                        ).toBeNull();
                    }
                );
        }
    }

    validateLastCommunication(
        value: string | null
    ): void {

        if (
            value !== null
        ) {

            expect(
                typeof value
            ).toBe("string");
        }
    }
}