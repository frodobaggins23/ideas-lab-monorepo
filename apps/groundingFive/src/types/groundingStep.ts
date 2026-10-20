export interface GroundingStep {
    readonly id: string;
    readonly sense: string;
    readonly count: number;
    readonly instruction: string;
    readonly icon: string;
    readonly gradient: string;
}
