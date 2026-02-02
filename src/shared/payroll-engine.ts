/**
 * Payroll Engine for Dominican Republic 🇩🇴
 * Rules based on TSS (Tesorería de la Seguridad Social) and DGII (Dirección General de Impuestos Internos)
 */

export interface PayrollDeductions {
    sfs: number; // Salud
    afp: number; // Pensión
    isr: number; // Impuesto Sobre la Renta
    employer_sfs: number;
    employer_afp: number;
    employer_srl: number;
    infotep: number;
}

export const PAYROLL_CONSTANTS = {
    EMPLOYEE_SFS_RATE: 0.0304, // 3.04%
    EMPLOYEE_AFP_RATE: 0.0287, // 2.87%
    EMPLOYER_SFS_RATE: 0.0709, // 7.09%
    EMPLOYER_AFP_RATE: 0.0710, // 7.10%
    EMPLOYER_SRL_RATE: 0.0110, // 1.10% (Variable by risk, 1.1% avg)
    EMPLOYER_INFOTEP_RATE: 0.01, // 1%
};

/**
 * Calculates ISR (Impuesto Sobre la Renta) based on DGII 2024 progressive scale
 * Annual scales:
 * Up to 416,220.00: Exempt
 * 416,220.01 to 624,329.00: 15% of the excess over 416,220.01
 * 624,329.01 to 867,123.00: 31,216.00 + 20% of the excess over 624,329.01
 * 867,123.01 and above: 79,776.00 + 25% of the excess over 867,123.01
 */
export function calculateISR(monthlyGross: number, deductionsSFS_AFP: number): number {
    const taxableMonthly = monthlyGross - deductionsSFS_AFP;
    const taxableAnnual = taxableMonthly * 12;
    let annualISR = 0;

    if (taxableAnnual <= 416220) {
        annualISR = 0;
    } else if (taxableAnnual <= 624329) {
        annualISR = (taxableAnnual - 416220.01) * 0.15;
    } else if (taxableAnnual <= 867123) {
        annualISR = 31216 + (taxableAnnual - 624329.01) * 0.20;
    } else {
        annualISR = 79776 + (taxableAnnual - 867123.01) * 0.25;
    }

    return annualISR / 12;
}

export function calculatePayroll(grossSalary: number): PayrollDeductions {
    const sfs = grossSalary * PAYROLL_CONSTANTS.EMPLOYEE_SFS_RATE;
    const afp = grossSalary * PAYROLL_CONSTANTS.EMPLOYEE_AFP_RATE;

    // ISR is calculated AFTER SFS and AFP deductions
    const isr = calculateISR(grossSalary, sfs + afp);

    return {
        sfs,
        afp,
        isr,
        employer_sfs: grossSalary * PAYROLL_CONSTANTS.EMPLOYER_SFS_RATE,
        employer_afp: grossSalary * PAYROLL_CONSTANTS.EMPLOYER_AFP_RATE,
        employer_srl: grossSalary * PAYROLL_CONSTANTS.EMPLOYER_SRL_RATE,
        infotep: grossSalary * PAYROLL_CONSTANTS.EMPLOYER_INFOTEP_RATE,
    };
}
