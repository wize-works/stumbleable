import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SettingsThemeToggle } from "../../components/ThemeToggle";
import { useTheme } from "../../lib/ThemeProvider";
import { useUniversalStyles } from "../../lib/useThemedStyles";

export default function SettingsScreen() {
    const { user } = useUser();
    const { signOut } = useAuth();
    const { theme } = useTheme();
    const styles = useUniversalStyles();

    const handleSignOut = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                            router.replace("/(auth)/sign-in");
                        } catch (error) {
                            Alert.alert("Error", "Failed to sign out");
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.containerPadded}>
                <Text style={[styles.title, { color: theme.colors.baseContent }]}>Settings</Text>

                {/* Appearance Section */}
                <View style={{ marginBottom: theme.spacing.xl }}>
                    <Text style={[styles.heading, { color: theme.colors.baseContent }]}>Appearance</Text>
                    <View style={styles.card}>
                        <SettingsThemeToggle />
                    </View>
                </View>

                {/* Profile Section */}
                <View style={{ marginBottom: theme.spacing.xl }}>
                    <Text style={[styles.heading, { color: theme.colors.baseContent }]}>Profile</Text>
                    <View style={styles.card}>
                        <Text style={[styles.captionText, { marginBottom: theme.spacing.xs }]}>Name</Text>
                        <Text style={[styles.bodyText, { color: theme.colors.baseContent }]}>
                            {user?.firstName} {user?.lastName}
                        </Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={[styles.captionText, { marginBottom: theme.spacing.xs }]}>Email</Text>
                        <Text style={[styles.bodyText, { color: theme.colors.baseContent }]}>
                            {user?.emailAddresses[0]?.emailAddress}
                        </Text>
                    </View>
                </View>

                {/* Discovery Section */}
                <View style={{ marginBottom: theme.spacing.xl }}>
                    <Text style={[styles.heading, { color: theme.colors.baseContent }]}>Discovery</Text>
                    <View style={styles.card}>
                        <Text style={[styles.captionText, { marginBottom: theme.spacing.xs }]}>Wildness Control</Text>
                        <Text style={[styles.bodyText, { color: theme.colors.placeholder }]}>Coming soon</Text>
                    </View>
                </View>

                {/* Sign Out Section */}
                <View style={{ marginBottom: theme.spacing.xl }}>
                    <TouchableOpacity
                        onPress={handleSignOut}
                        style={[styles.buttonSecondary, {
                            backgroundColor: theme.colors.error,
                            borderColor: theme.colors.error
                        }]}
                    >
                        <Text style={[styles.buttonText, { color: theme.colors.errorContent }]}>
                            Sign Out
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

