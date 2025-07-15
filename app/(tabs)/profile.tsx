import styles from "@/app/style";
import { sendNotification } from "@/components/utils/notification";
import { COLORS } from "@/constants/DiabetesConstants";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
    return (
        <ScrollView style={styles.profile_container}>
            {/* Header */}

            {/* Profile Card */}
            <View style={styles.profileCard}>
                {/* Profile Picture */}
                <View style={styles.profileImageContainer}>
                    <View style={styles.profileImage}>
                        <Image
                            source={require("@/assets/images/prince.png")}
                            style={{
                                width: 150,
                                height: 150,
                                borderRadius: 75,
                            }}
                        />
                    </View>{" "}
                </View>

               
                {/* Name */}
                <Text style={styles.userName}>John Prince Alonte</Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Profile Information */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Age</Text>
                            <Text style={styles.infoValue}>22 years old</Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>
                                Average Glucose Level
                            </Text>
                            <Text style={styles.infoValue}>142 mg/dL</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Diabetes Type</Text>
                            <Text style={styles.infoValue}>Type 2</Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>HbA1c Level</Text>
                            <Text style={styles.infoValue}>6.9%</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>CGM</Text>
                            <Text style={styles.infoValue}>
                                FreeStyle Libre
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>SmartWatch</Text>
                            <Text style={styles.infoValue}>
                                Redmi Watch 5 Light
                            </Text>
                        </View>
                    </View>

                    {/* Emergency Contacts Section */}
                    <View style={styles.contactSection}>
                        <Text style={styles.sectionTitle}>
                            Emergency Contacts
                        </Text>

                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>
                                    Iben E. Anoos
                                </Text>
                                <Text style={styles.infoValue}>
                                    09918750974
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>
                                    Jake Bajenting
                                </Text>
                                <Text style={styles.infoValue}>
                                    09562461476
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Second Divider */}
                <View style={styles.divider} />

                {/* Menu Options */}
                <View style={styles.menuSection}>
                    <View style={styles.menuItem}>
                        <Ionicons
                            name="bulb-outline"
                            size={24}
                            color={COLORS.primary}
                        />
                        <Text style={styles.menuText}>Tips for Wellness</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={COLORS.gray}
                        />
                    </View>

                    <View style={styles.menuItem}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={24}
                            color={COLORS.primary}
                        />
                        <Text style={styles.menuText}>Data and Privacy</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={COLORS.gray}
                        />
                    </View>

                    <View style={styles.menuItem}>
                        <Ionicons
                            name="settings-outline"
                            size={24}
                            color={COLORS.primary}
                        />
                        <Text style={styles.menuText}>Settings</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={COLORS.gray}
                        />
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
