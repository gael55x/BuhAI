import styles from "@/app/style";
import { COLORS } from "@/constants/DiabetesConstants";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Message {
    id: number;
    type: "ai" | "user" | "user_options";
    message: string;
    time: string;
    options?: string[];
}

export default function ChatScreen() {
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversation, setConversation] = useState<Message[]>([
        {
            id: 1,
            type: "ai",
            message:
                "Hello! Ako si BuhAI, imong personal nga tabang sa diabetes. Makatabang ko nimo sa pagdumala sa glucose, pagplano sa pagkaon, ug mga kasayuran sa panglawas. Unsaon nako pagtabang nimo karon?",
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        },
    ]);

    const sendMessage = async () => {
        if (!message.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            type: "user",
            message: message.trim(),
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        // Add user message to conversation
        setConversation((prev: Message[]) => [...prev, userMessage]);
        const currentMessage = message.trim();
        setMessage("");
        setIsLoading(true);

        try {
            const backendApiUrl = "http://localhost:4000/api/v1/chat";

            console.log("Making API request to BuhAI backend...");

            const response = await fetch(backendApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: "demo_user_01", // Hardcoded for now
                    msg: currentMessage,
                    ts: new Date().toISOString(), // Use current date and time
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "API Error Response:",
                    response.status,
                    response.statusText,
                    errorText
                );
                throw new Error(
                    `HTTP error! status: ${response.status} - ${errorText}`
                );
            }

            const data = await response.json();
            console.log("API Response Success:", JSON.stringify(data, null, 2));

            const text =
                data.reply_bisaya || "Sorry, I could not generate a response.";
            console.log("Extracted text:", text.substring(0, 100) + "...");

            // Add AI response to conversation
            const aiMessage: Message = {
                id: Date.now() + 1,
                type: "ai",
                message: text,
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setConversation((prev: Message[]) => [...prev, aiMessage]);
        } catch (error) {
            console.error("Detailed error calling BuhAI backend API:", error);

            // Add error message to conversation
            const errorMessage: Message = {
                id: Date.now() + 1,
                type: "ai",
                message: `I apologize, but I'm having trouble connecting right now. Error: ${
                    error instanceof Error ? error.message : "Unknown error"
                }. Please check your network connection and try again.`,
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setConversation((prev: Message[]) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOptionPress = (option: string) => {
        setMessage(option);
        // Automatically send the option as a message
        setTimeout(() => sendMessage(), 100);
    };

    const renderMessage = (msg: Message) => {
        if (msg.type === "user_options") {
            return (
                <View key={msg.id} style={styles.optionsContainer}>
                    {msg.options?.map((option: string, index: number) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.optionButton}
                            onPress={() => handleOptionPress(option)}
                        >
                            <Text style={styles.optionText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.skipButton}>
                        <Text style={styles.skipText}>Ask BuhAI anything</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (msg.type === "user") {
            return (
                <View
                    key={msg.id}
                    style={[styles.messageContainer, styles.userMessage]}
                >
                    <View style={styles.userMessageBubble}>
                        <Text style={styles.userMessageText}>
                            {msg.message}
                        </Text>
                        <Text style={styles.userMessageTime}>{msg.time}</Text>
                    </View>
                    <View style={styles.userAvatar}>
                        <Image
                            source={require("@/assets/images/prince.png")}
                            style={{ width: 32, height: 32, borderRadius: 16 }}
                        />
                    </View>
                </View>
            );
        }

        return (
            <View
                key={msg.id}
                style={[styles.messageContainer, styles.aiMessage]}
            >
                <View style={styles.aiAvatar}>
                    <Image
                        source={require("@/assets/images/icon.png")}
                        style={{ width: 32, height: 32, borderRadius: 16 }}
                    />
                </View>
                <View style={styles.aiMessageBubble}>
                    <Text style={styles.aiMessageText}>{msg.message}</Text>
                    <Text style={styles.messageTime}>{msg.time}</Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Orange Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>24/7 PERSONAL</Text>
                    <Text style={styles.headerTitle}>DIABETES ASSISTANT</Text>
                </View>
            </View>

            {/* Chat Container */}
            <View style={styles.chatContainer}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatHeaderText}>BuhAI</Text>
                </View>

                {/* Messages */}
                <ScrollView
                    style={styles.messagesContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {conversation.map(renderMessage)}
                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <Image
                                source={require("@/assets/images/icon.png")}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                }}
                            />
                            <View style={styles.aiMessageBubble}>
                                <ActivityIndicator
                                    size="small"
                                    color={COLORS.primary}
                                />
                                <Text style={styles.loadingText}>
                                    BuhAI is thinking...
                                </Text>
                               
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Ask BuhAI about your diabetes..."
                        placeholderTextColor={COLORS.gray}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        onSubmitEditing={sendMessage}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            isLoading && styles.sendButtonDisabled,
                        ]}
                        onPress={sendMessage}
                        disabled={isLoading}
                    >
                        <Ionicons name="send" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
