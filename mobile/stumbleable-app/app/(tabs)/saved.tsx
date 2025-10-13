import { useUser } from "@clerk/clerk-expo";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../lib/ThemeProvider";
import { useUniversalStyles } from "../../lib/useThemedStyles";

export default function SavedScreen() {
    const { user } = useUser();
    const { theme } = useTheme();
    const styles = useUniversalStyles();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.containerPadded}>
                <Text style={[styles.title, { color: theme.colors.baseContent }]}>
                    Saved Discoveries
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>
                    Your bookmarked content
                </Text>

                {/* This will show saved items from the interaction service */}
                <View style={[
                    styles.card,
                    {
                        flex: 1,
                        justifyContent: 'center' as const,
                        alignItems: 'center' as const,
                        marginTop: theme.spacing.xl
                    }
                ]}>
                    <Text style={[
                        styles.heading,
                        {
                            color: theme.colors.placeholder,
                            textAlign: 'center' as const,
                            marginBottom: theme.spacing.sm
                        }
                    ]}>
                        🔖 No saved items yet
                    </Text>
                    <Text style={[
                        styles.bodyText,
                        {
                            color: theme.colors.placeholder,
                            textAlign: 'center' as const
                        }
                    ]}>
                        Start stumbling to save interesting discoveries
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

