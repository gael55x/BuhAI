// utils/notifications.ts
import * as Notifications from "expo-notifications";

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Request permissions
export async function requestNotificationPermissions() {
    const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        alert("Failed to get push notification token for push notification!");
        return false;
    }
    return true;
}

// Schedule a local notification
export async function scheduleNotification(
    title: string,
    body: string,
    seconds: number = 5
) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: { data: "goes here" },
        },
        trigger: {
            seconds,
            repeats: false,
        } as any,
    });
}

// Send immediate notification
export async function sendNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: { data: "goes here" },
        },
        trigger: null, // Send immediately
    });
}

// Get push token for remote notifications
export async function getPushToken() {
    try {
        const token = await Notifications.getExpoPushTokenAsync();
        console.log("Push token:", token.data);
        return token.data;
    } catch (error) {
        console.log("Error getting push token:", error);
        return null;
    }
}

// Diabetes-specific notification functions
export async function sendGlucoseAlert(
    glucoseValue: number,
    type: "high" | "low"
) {
    const title = type === "high" ? "High Glucose Alert!!" : "Low Glucose Alert!!";
    const body =
        type === "high"
            ? `Your glucose level is ${glucoseValue} mg/dL. Calling Iben Anoos....`
            : `Your glucose level is ${glucoseValue} mg/dL. Consider having a snack.`;

    await sendNotification(title, body);
}

export async function scheduleMedicationReminder() {
    await sendNotification(
        "Medication Reminder",
        "Time to take your medication"
    );
}

export async function scheduleGlucoseCheckReminder() {
    await sendNotification("Glucose Check", "Time to check your glucose level");
}

export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}
