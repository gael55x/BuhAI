import styles from "@/app/style";
import { sendGlucoseAlert } from "@/components/utils/notification";
import { GLUCOSE_LIMITS, MOCK_DATA } from "@/constants/DiabetesConstants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function SensorsScreen() {
  const [glucoseValue, setGlucoseValue] = useState(
    MOCK_DATA.glucoseData[MOCK_DATA.glucoseData.length - 1]
  );

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Notification permissions not granted!");
    }
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      await requestNotificationPermissions();
      await sendGlucoseAlert(190, "high");
    };
    initializeNotifications();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlucoseValue((prev) => {
        const newValue = prev + (Math.random() - 0.5) * 4;
        return Math.round(
          Math.max(GLUCOSE_LIMITS.min, Math.min(GLUCOSE_LIMITS.max, newValue))
        );
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getGlucoseStatus = () => {
    if (glucoseValue < 80) return { status: "Low", color: "#ef4444" };
    if (glucoseValue > 160) return { status: "High", color: "#f59e0b" };
    return { status: "Normal", color: "#10b981" };
  };

  const { status, color } = getGlucoseStatus();

  const glucosePercentage = Math.min(
    Math.max((glucoseValue - 70) / (180 - 70), 0),
    1
  );
  const angle = glucosePercentage * 270;

  return (
    <ScrollView
      style={styles.sensor_container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.sensor_header}>
        <Text style={styles.sensor_headerTitle}>BuhAI</Text>
        <Text style={styles.sensor_headerSubtitle}>Today</Text>
      </View>

      <View style={styles.cgmContainer}>
        <View style={styles.circularMeter}>
          <View style={styles.backgroundCircle} />

          {Array.from({ length: 54 }).map((_, index) => {
            const progressAngle = index * 5 - 135;
            const isActive = index * 5 <= angle;

            return (
              <View
                key={index}
                style={[
                  styles.circularProgressBar,
                  {
                    transform: [
                      { rotate: `${progressAngle}deg` },
                      { translateY: -92 },
                    ],
                    backgroundColor: isActive ? color : "transparent",
                  },
                ]}
              />
            );
          })}

          <View style={styles.centerContent}>
            <Text style={styles.glucoseValue}>{glucoseValue}</Text>
            <Text style={styles.glucoseUnit}>mg/dL</Text>
            <View style={styles.statusContainer}>
              <Text style={[styles.statusText, { color }]}>{status}</Text>
            </View>
          </View>

          <Text style={styles.rangeLabel1}>70</Text>
          <Text style={styles.rangeLabel2}>180</Text>
        </View>

        <Text style={styles.lastReading}>Last reading: 5 min ago</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.sleepCard]}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="sleep" size={24} color="#6366f1" />
              <Text style={styles.metricTitle}>Sleep</Text>
            </View>
            <Text style={styles.metricValue}>{MOCK_DATA.sleep}</Text>
            <Text style={styles.metricSubtext}>Last night</Text>
            <View style={styles.sleepQuality}>
              <View
                style={[styles.qualityDot, { backgroundColor: "#10b981" }]}
              />
              <Text style={styles.qualityText}>Good Quality</Text>
            </View>
          </View>

          <View style={[styles.metricCard, styles.heartRateCard]}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={24}
                color="#ef4444"
              />
              <Text style={styles.metricTitle}>Heart Rate</Text>
            </View>
            <Text style={styles.metricValue}>{MOCK_DATA.heartRate}</Text>
            <Text style={styles.metricSubtext}>BPM</Text>
            <View style={styles.heartRateRange}>
              <Text style={styles.rangeText}>Resting: 68-76</Text>
            </View>
          </View>
        </View>

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
                {MOCK_DATA.steps.toLocaleString()}
              </Text>
              <Text style={styles.metricSubtext}>of 10,000 goal</Text>
            </View>
            <View style={styles.stepsProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(MOCK_DATA.steps / 10000) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((MOCK_DATA.steps / 10000) * 100)}% complete
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.trendChart}>
        <View style={styles.sensor_chartHeader}>
          <Text style={styles.sensor_chartTitle}>Glucose Trend</Text>
          <Text style={styles.sensor_chartSubtitle}>Last 4 hours</Text>
        </View>

        <View style={styles.sensor_chartContainer}>
          <View style={styles.sensor_chartBackground}>
            <View style={[styles.sensor_gridLine, { top: "20%" }]} />
            <View style={[styles.sensor_gridLine, { top: "40%" }]} />
            <View style={[styles.sensor_gridLine, { top: "60%" }]} />
            <View style={[styles.sensor_gridLine, { top: "80%" }]} />

            <View style={styles.trendLine}>
              {MOCK_DATA.glucoseData.slice(-8).map((value, index) => (
                <View
                  key={index}
                  style={[
                    styles.sensor_dataPoint,
                    {
                      left: `${(index / 7) * 85 + 7.5}%`,
                      bottom: `${((value - 70) / (250 - 70)) * 80 + 10}%`,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.yAxisLabels}>
            <Text style={styles.axisLabel}>250</Text>
            <Text style={styles.axisLabel}>200</Text>
            <Text style={styles.axisLabel}>150</Text>
            <Text style={styles.axisLabel}>100</Text>
            <Text style={styles.axisLabel}>70</Text>
          </View>

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
