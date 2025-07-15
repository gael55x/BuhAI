export const COLORS = {
    primary: "#7c3aed",
    primaryLight: "#a78bfa",
    primaryBg: "#ede9fe",
    primaryCircle: "#ddd6fe",
    blue: "#0ea5e9",
    blueLight: "#38bdf8",
    blueBg: "#e0f2fe",
    blueCircle: "#bae6fd",
    red: "#ef4444",
    redBg: "#fee2e2",
    redCircle: "#fecaca",
    green: "#22c55e",
    greenBg: "#dcfce7",
    greenCircle: "#bbf7d0",
    gray: "#6b7280",
    grayLight: "#a1a1aa",
    grayBg: "#f3f4f6",
    dark: "#18181b",
    white: "#fff",
};

export const MOCK_DATA = {
    glucoseData: [
        110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 170, 180, 175,
        165, 155, 145, 135, 125, 107,
    ],
    sleep: "7h 45m",
    heartRate: 82,
    steps: 6500,
};

export const GLUCOSE_LIMITS = {
    min: 70,
    max: 180,
    graphMin: 70,
    graphMax: 250,
};

export interface FoodLog {
    food: string;
    carbs: string;
    time: string;
}

export interface InsulinLog {
    units: string;
    time: string;
}
