import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function IndexScreen() {
    const { isSignedIn, isLoaded } = useAuth();

    // Show loading spinner while Clerk loads
    if (!isLoaded) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // Redirect based on authentication status
    if (isSignedIn) {
        return <Redirect href="/(tabs)/stumble" />;
    } else {
        return <Redirect href="/(auth)/sign-in" />;
    }
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F2F2F7",
    },
});