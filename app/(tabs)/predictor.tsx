import styles from "@/app/style";
import { COLORS } from "@/constants/DiabetesConstants";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { apiService, GlucosePrediction } from "@/services/api";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
 
export default function PredictorScreen() {
    const [predictionData, setPredictionData] = useState<GlucosePrediction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentGlucose, setCurrentGlucose] = useState(120);
    
    // Fetch prediction data
    const fetchPrediction = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get current glucose and prediction
            const [healthData, prediction] = await Promise.all([
                apiService.getHealthData(),
                apiService.getGlucosePrediction(currentGlucose)
            ]);
            
            setCurrentGlucose(healthData.glucose);
            setPredictionData(prediction);
        } catch (err) {
            console.error('Error fetching prediction:', err);
            setError('Failed to load prediction data');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchPrediction();
    }, []);
    
    // Generate predicted glucose values for chart display
    const generateChartData = () => {
        if (!predictionData) return [];
        
        const baseGlucose = currentGlucose;
        const pred30 = predictionData.predictions["30min"];
        const pred60 = predictionData.predictions["60min"];
        
        // Create intermediate values for smoother chart
        const chartData = [];
        for (let i = 0; i <= 6; i++) {
            if (i <= 3) {
                // Current readings (past 15 minutes)
                chartData.push(baseGlucose + (Math.random() - 0.5) * 10);
            } else {
                // Predicted values (next 30 minutes)
                const progress = (i - 3) / 3; // 0 to 1
                const predictedValue = baseGlucose + (pred30 - baseGlucose) * progress;
                chartData.push(predictedValue);
            }
        }
        
        return chartData;
    };
    
    const chartData = generateChartData();

    // Analysis based on predictions
    const getPredictionAnalysis = () => {
        if (!predictionData) {
            return {
                trend: "Loading",
                color: "#6b7280",
                advice: "Loading prediction data...",
                icon: "trending-up" as "trending-up" | "trending-down",
            };
        }
        
        const predicted30 = predictionData.predictions["30min"];
        if (predicted30 > 180) {
            return {
                trend: "Rising High",
                color: "#ef4444",
                advice: "Your glucose is predicted to rise above target range. Consider checking your recent meal intake or activity level.",
                icon: "trending-up" as "trending-up" | "trending-down",
            };
        } else if (predicted30 < 80) {
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
                <TouchableOpacity
                    style={{
                        backgroundColor: COLORS.primary,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        marginTop: 10,
                    }}
                    onPress={fetchPrediction}
                    disabled={loading}
                >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                        {loading ? 'Loading...' : 'Refresh Prediction'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Loading State */}
            {loading && (
                <View style={{ alignItems: 'center', padding: 40 }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ marginTop: 16, color: '#6b7280' }}>
                        Generating AI prediction...
                    </Text>
                </View>
            )}

            {/* Error State */}
            {error && (
                <View style={{ alignItems: 'center', padding: 40 }}>
                    <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 16 }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        style={{
                            backgroundColor: COLORS.primary,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 8,
                        }}
                        onPress={fetchPrediction}
                    >
                        <Text style={{ color: 'white', fontWeight: '600' }}>
                            Retry
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Main Content */}
            {!loading && !error && predictionData && (
                <>

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
                        {/* Chart data points */}
                        {chartData.map((value: number, index: number) => (
                            <View
                                key={`chart-${index}`}
                                style={[
                                    styles.dataPoint,
                                    {
                                        left: `${(index / 7) * 45 + 5}%`,
                                        bottom: `${
                                            ((value - 70) / (250 - 70)) * 80 +
                                            10
                                        }%`,
                                        backgroundColor: index <= 3 ? "#10b981" : "#ef4444",
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
                            {predictionData ? Math.round(predictionData.predictions["30min"]) : "--"} mg/dL
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
                    {predictionData?.message?.includes("Fallback") && (
                        <Text style={{
                            fontSize: 12,
                            color: '#f59e0b',
                            fontWeight: '600',
                            marginLeft: 'auto'
                        }}>
                            Simple Mode
                        </Text>
                    )}
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
                    {predictionData?.message?.includes("Fallback") && (
                        <View style={styles.insightItem}>
                            <Text style={[styles.insightText, { color: '#f59e0b' }]}>
                                • Using simplified prediction (Advanced AI model temporarily unavailable)
                            </Text>
                        </View>
                    )}
                </View>
            </View>
                </>
            )}
        </ScrollView>
    );
}
