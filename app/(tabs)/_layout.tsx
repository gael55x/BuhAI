import {
    FontAwesome5,
    Ionicons,
    MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Tabs } from "expo-router";
import {
    Platform,
    View,
} from "react-native";

//import styles from "@/app/style";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";

const COLORS = {
    primary: "#7c3aed",
    primaryLight: "#a78bfa",
    gray: "#6b7280",
};

export default function TabLayout() {
    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: COLORS.primary,
                    tabBarInactiveTintColor: COLORS.gray,
                    headerShown: false,
                    headerStyle: {
                        backgroundColor: COLORS.primary,
                    },
                    headerTintColor: "#fff",
                    headerTitleStyle: {
                        fontWeight: "bold",
                        fontSize: 18,
                        letterSpacing: 1,
                    },
                    tabBarButton: HapticTab,
                    tabBarBackground: TabBarBackground,
                    tabBarStyle: {
                        backgroundColor: "rgba(168,139,250,0.08)",
                        borderTopWidth: 1,
                        borderTopColor: "rgba(168,139,250,0.18)",
                        paddingVertical: 8,
                        paddingHorizontal: 10, // Add horizontal padding
                        height: 100, // Slightly taller to accommodate FAB better
                        ...Platform.select({
                            ios: {
                                position: "absolute",
                            },
                            default: {},
                        }),
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        letterSpacing: 1,
                        marginTop: 2,
                    },
                }}
            >
                <Tabs.Screen
                    name="sensors"
                    options={{
                        tabBarLabel: "Sensors",
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons
                                name="access-point"
                                size={size || 24}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="predictor"
                    options={{
                        tabBarLabel: "Insight",
                        tabBarIcon: ({ color, size }) => (
                            <FontAwesome5
                                name="chart-line"
                                size={(size || 24) - 2}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="chat"
                    options={{
                        tabBarLabel: "Chat",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons
                                name="chatbubble-ellipses-outline"
                                size={(size || 24) - 2}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        tabBarLabel: "Profile",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons
                                name="person-circle-outline"
                                size={size || 24}
                                color={color}
                            />
                        ),
                    }}
                />
            </Tabs>
        </View>
    );
}
