import styles from "@/app/style";
import { sendGlucoseAlert } from "@/components/utils/notification";
import { GLUCOSE_LIMITS } from "@/constants/DiabetesConstants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { apiService, HealthData } from "@/services/api";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";

export default function SensorsScreen() {
    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [glucoseTrend, setGlucoseTrend] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const requestNotificationPermissions = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
            console.warn("Notification permissions not granted!");
        }
    };

    // Fetch health data from API
    const fetchHealthData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [healthDataResponse, trendData] = await Promise.all([
                apiService.getHealthData(),
                apiService.getGlucoseTrend()
            ]);
            
            setHealthData(healthDataResponse);
            setGlucoseTrend(trendData);
            
            // Send glucose alert if needed
            if (healthDataResponse.glucose > 190) {
                await sendGlucoseAlert(healthDataResponse.glucose, "high");
            } else if (healthDataResponse.glucose < 80) {
                await sendGlucoseAlert(healthDataResponse.glucose, "low");
            }
        } catch (err) {
            console.error('Error fetching health data:', err);
            setError('Failed to load health data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            await requestNotificationPermissions();
            await fetchHealthData();
        };
        initializeApp();
    }, []);

    // Refresh data periodically
    useEffect(() => {
        const interval = setInterval(() => {
            fetchHealthData();
        }, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Calculate glucose status and color
    const getGlucoseStatus = () => {
        if (!healthData) return { status: "Loading", color: "#6b7280" };
        const glucose = healthData.glucose;
        if (glucose < 80) return { status: "Low", color: "#ef4444" };
        if (glucose > 160) return { status: "High", color: "#f59e0b" };
        return { status: "Normal", color: "#10b981" };
    };

    const { status, color } = getGlucoseStatus();

    // Calculate angle for circular progress (0-270 degrees for 3/4 circle)
    const glucosePercentage = healthData ? Math.min(
        Math.max((healthData.glucose - 70) / (180 - 70), 0),
        1
    ) : 0;
    const angle = glucosePercentage * 270;

    return (
        <ScrollView
            style={styles.sensor_container}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.sensor_header}>
                <Text style={styles.sensor_headerTitle}>BuhAI</Text>
                <Text style={styles.sensor_headerSubtitle}>Today</Text>
            </View>

            {/* Circular CGM Display */}
            <View style={styles.cgmContainer}>
                <View style={styles.circularMeter}>
                    {/* Background Circle */}
                    <View style={styles.backgroundCircle} />

                    {/* Progress Bars positioned around the circle */}
                    {Array.from({ length: 54 }).map((_, index) => {
                        const progressAngle = index * 5 - 135; // Start from -135 degrees, 5 degrees each
                        const isActive = index * 5 <= angle;

                        return (
                            <View
                                key={index}
                                style={[
                                    styles.circularProgressBar,
                                    {
                                        transform: [
                                            { rotate: `${progressAngle}deg` },
                                            { translateY: -92 }, // Half of circle radius
                                        ],
                                        backgroundColor: isActive
                                            ? color
                                            : "transparent",
                                    },
                                ]}
                            />
                        );
                    })}

                    {/* Center Content */}
                    <View style={styles.centerContent}>
                        <Text style={styles.glucoseValue}>
                            {healthData ? healthData.glucose : "--"}
                        </Text>
                        <Text style={styles.glucoseUnit}>mg/dL</Text>
                        <View style={styles.statusContainer}>
                            <Text style={[styles.statusText, { color }]}>
                                {status}
                            </Text>
                        </View>
                    </View>

                    {/* Range Labels */}

                    <Text style={styles.rangeLabel1}>70</Text>
                    <Text style={styles.rangeLabel2}>180</Text>
                </View>

                <Text style={styles.lastReading}>Last reading: 5 min ago</Text>
            </View>

            {/* Health Metrics Grid */}
            <View style={styles.metricsGrid}>
                {/* Sleep and Heart Rate Row */}
                <View style={styles.metricsRow}>
                    {/* Sleep Card */}
                    <View style={[styles.metricCard, styles.sleepCard]}>
                        <View style={styles.metricHeader}>
                            <MaterialCommunityIcons
                                name="sleep"
                                size={24}
                                color="#6366f1"
                            />
                            <Text style={styles.metricTitle}>Sleep</Text>
                        </View>
                        <Text style={styles.metricValue}>
                            {healthData?.sleep || "--"}
                        </Text>
                        <Text style={styles.metricSubtext}>Last night</Text>
                        <View style={styles.sleepQuality}>
                            <View
                                style={[
                                    styles.qualityDot,
                                    { backgroundColor: "#10b981" },
                                ]}
                            />
                            <Text style={styles.qualityText}>Good Quality</Text>
                        </View>
                    </View>

                    {/* Heart Rate Card */}
                    <View style={[styles.metricCard, styles.heartRateCard]}>
                        <View style={styles.metricHeader}>
                            <MaterialCommunityIcons
                                name="heart-pulse"
                                size={24}
                                color="#ef4444"
                            />
                            <Text style={styles.metricTitle}>Heart Rate</Text>
                        </View>
                        <Text style={styles.metricValue}>
                            {healthData?.heartRate || "--"}
                        </Text>
                        <Text style={styles.metricSubtext}>BPM</Text>
                        <View style={styles.heartRateRange}>
                            <Text style={styles.rangeText}>Resting: 68-76</Text>
                        </View>
                    </View>
                </View>

                {/* Daily Steps Card - Full Width */}
                <View style={[styles.metricCard, styles.stepsCard]}>
                    <View style={styles.metricHeader}>
                        <MaterialCommunityIcons
                            name="shoe-print"
                            size={24}
                            color="#f59e0b"
                        />
                        <Text style={styles.metricTitle}>Daily Steps</Text>
                    </View>
                    <View style={styles.stepsContent}>
                        <View style={styles.stepsLeft}>
                            <Text style={styles.metricValue}>
                                {healthData?.steps?.toLocaleString() || "--"}
                            </Text>
                            <Text style={styles.metricSubtext}>
                                of 10,000 goal
                            </Text>
                        </View>
                        <View style={styles.stepsProgress}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${
                                                healthData ? (healthData.steps / 10000) * 100 : 0
                                            }%`,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {healthData ? Math.round((healthData.steps / 10000) * 100) : 0}%
                                complete
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Glucose Trend Chart */}
            <View style={styles.trendChart}>
                <View style={styles.sensor_chartHeader}>
                    <Text style={styles.sensor_chartTitle}>Glucose Trend</Text>
                    <Text style={styles.sensor_chartSubtitle}>
                        Last 4 hours
                    </Text>
                </View>

                {/* Chart Container */}
                <View style={styles.sensor_chartContainer}>
                    {/* Chart Background */}
                    <View style={styles.sensor_chartBackground}>
                        {/* Horizontal grid lines */}
                        <View
                            style={[styles.sensor_gridLine, { top: "20%" }]}
                        />
                        <View
                            style={[styles.sensor_gridLine, { top: "40%" }]}
                        />
                        <View
                            style={[styles.sensor_gridLine, { top: "60%" }]}
                        />
                        <View
                            style={[styles.sensor_gridLine, { top: "80%" }]}
                        />

                        {/* Glucose trend line simulation */}
                        <View style={styles.trendLine}>
                            {glucoseTrend
                                .slice(-8)
                                .map((value: number, index: number) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.sensor_dataPoint,
                                            {
                                                left: `${
                                                    (index / 7) * 85 + 7.5
                                                }%`,
                                                bottom: `${
                                                    ((value - 70) /
                                                        (250 - 70)) *
                                                        80 +
                                                    10
                                                }%`,
                                            },
                                        ]}
                                    />
                                ))}
                        </View>
                    </View>

                    {/* Y-axis labels */}
                    <View style={styles.yAxisLabels}>
                        <Text style={styles.axisLabel}>250</Text>
                        <Text style={styles.axisLabel}>200</Text>
                        <Text style={styles.axisLabel}>150</Text>
                        <Text style={styles.axisLabel}>100</Text>
                        <Text style={styles.axisLabel}>70</Text>
                    </View>

                    {/* X-axis labels */}
                    <View style={styles.xAxisLabels}>
                        <Text style={styles.axisLabel}>12PM</Text>
                        <Text style={styles.axisLabel}>1PM</Text>
                        <Text style={styles.axisLabel}>2PM</Text>
                        <Text style={styles.axisLabel}>Now</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
