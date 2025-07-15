import styles from "@/app/style";
import { COLORS, MOCK_DATA } from "@/constants/DiabetesConstants";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
 
export default function PredictorScreen() {
    // Generate predicted glucose values (30 mins from now)
    const currentGlucose =
        MOCK_DATA.glucoseData[MOCK_DATA.glucoseData.length - 1];
    const predictedValues = [
        currentGlucose + 5,
        currentGlucose + 8,
        currentGlucose + 12,
        currentGlucose + 15,
    ];

    // Analysis based on predictions
    const getPredictionAnalysis = () => {
        const avgPredicted =
            predictedValues.reduce((a, b) => a + b, 0) / predictedValues.length;
        if (avgPredicted > 180) {
            return {
                trend: "Rising High",
                color: "#ef4444",
                advice: "Your glucose is predicted to rise above target range. Consider checking your recent meal intake or activity level.",
                icon: "trending-up" as "trending-up" | "trending-down",
            };
        } else if (avgPredicted < 80) {
            return {
                trend: "Dropping Low",
                color: "#ef4444",
                advice: "Your glucose may drop below target range. Consider having a small snack if you feel symptoms.",
                icon: "trending-down" as "trending-up" | "trending-down",
            };
        } else {
            return {
                trend: "Stable",
                color: "#10b981",
                advice: "Your glucose levels are predicted to remain in a healthy range over the next 30 minutes.",
                icon: "trending-up",
            };
        }
    };

    const analysis = getPredictionAnalysis();

    return (
        <ScrollView
            style={styles.predictor_container}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.predictor_header}>
                <Text style={styles.predictor_headerTitle}>Glucose Predictor</Text>
                <Text style={styles.headerSubtitle}>
                    AI-powered 30-minute forecast
                </Text>
            </View>

            {/* Prediction Chart */}
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Glucose Prediction</Text>
                    <Text style={styles.chartSubtitle}>Next 30 minutes</Text>
                </View>

                {/* Chart Container */}
                <View style={styles.chartContainer}>
                    {/* Chart Background */}
                    <View style={styles.chartBackground}>
                        {/* Horizontal grid lines */}
                        <View style={[styles.gridLine, { top: "20%" }]} />
                        <View style={[styles.gridLine, { top: "40%" }]} />
                        <View style={[styles.gridLine, { top: "60%" }]} />
                        <View style={[styles.gridLine, { top: "80%" }]} />

                        {/* Current glucose points (green) */}
                        {MOCK_DATA.glucoseData.slice(-4).map((value, index) => (
                            <View
                                key={`current-${index}`}
                                style={[
                                    styles.dataPoint,
                                    {
                                        left: `${(index / 7) * 45 + 5}%`,
                                        bottom: `${
                                            ((value - 70) / (250 - 70)) * 80 +
                                            10
                                        }%`,
                                        backgroundColor: "#10b981",
                                    },
                                ]}
                            />
                        ))}

                        {/* Predicted glucose points (red) */}
                        {predictedValues.map((value, index) => (
                            <View
                                key={`predicted-${index}`}
                                style={[
                                    styles.dataPoint,
                                    {
                                        left: `${((index + 4) / 7) * 45 + 5}%`,
                                        bottom: `${
                                            ((value - 70) / (250 - 70)) * 80 +
                                            10
                                        }%`,
                                        backgroundColor: "#ef4444",
                                    },
                                ]}
                            />
                        ))}

                        {/* Divider line between current and predicted */}
                        <View style={styles.dividerLine} />
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
                        <Text style={styles.axisLabel}>-15m</Text>
                        <Text style={styles.axisLabel}>-10m</Text>
                        <Text style={styles.axisLabel}>-5m</Text>
                        <Text style={styles.axisLabel}>Now</Text>
                        <Text style={styles.axisLabel}>+10m</Text>
                        <Text style={styles.axisLabel}>+20m</Text>
                        <Text style={styles.axisLabel}>+30m</Text>
                    </View>
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View
                            style={[
                                styles.legendDot,
                                { backgroundColor: "#10b981" },
                            ]}
                        />
                        <Text style={styles.legendText}>Current readings</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View
                            style={[
                                styles.legendDot,
                                { backgroundColor: "#ef4444" },
                            ]}
                        />
                        <Text style={styles.legendText}>Predicted values</Text>
                    </View>
                </View>
            </View>

            {/* Analysis Card */}
            <View style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                    <MaterialCommunityIcons
                        name={analysis.icon as "trending-up" | "trending-down"}
                        size={24}
                        color={analysis.color}
                    />
                    <Text style={styles.analysisTitle}>
                        Prediction Analysis
                    </Text>
                </View>

                <View style={styles.trendContainer}>
                    <Text style={styles.trendLabel}>Predicted Trend:</Text>
                    <Text
                        style={[styles.trendValue, { color: analysis.color }]}
                    >
                        {analysis.trend}
                    </Text>
                </View>

                <Text style={styles.adviceText}>{analysis.advice}</Text>

                <View style={styles.predictionDetails}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Current Level</Text>
                        <Text style={styles.detailValue}>
                            {currentGlucose} mg/dL
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Predicted (+30m)</Text>
                        <Text
                            style={[styles.detailValue, { color: "#ef4444" }]}
                        >
                            {predictedValues[predictedValues.length - 1]} mg/dL
                        </Text>
                    </View>
                </View>
            </View>

            {/* AI Insights Card */}
            <View style={styles.insightsCard}>
                <View style={styles.insightsHeader}>
                    <FontAwesome5
                        name="brain"
                        size={20}
                        color={COLORS.primary}
                    />
                    <Text style={styles.insightsTitle}>AI Insights</Text>
                </View>

                <View style={styles.insightsList}>
                    <View style={styles.insightItem}>
                        <Text style={styles.insightText}>
                            • Based on your recent patterns, glucose tends to
                            rise slightly after this time of day
                        </Text>
                    </View>
                    <View style={styles.insightItem}>
                        <Text style={styles.insightText}>
                            • Your last meal was 2 hours ago, which may
                            contribute to the predicted trend
                        </Text>
                    </View>
                    <View style={styles.insightItem}>
                        <Text style={styles.insightText}>
                            • Consider light activity to help maintain stable
                            levels
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
