import {
    faBookmark,
    faGear,
    faList,
    faShuffle
} from "@awesome.me/kit-240c9f263d/icons/sharp-duotone/solid";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Tabs } from "expo-router";
import { HeaderThemeToggle } from "../../components/ThemeToggle";
import { useTheme } from "../../lib/ThemeProvider";

export default function TabLayout() {
    const { theme } = useTheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.colors.primary, // Pink #FF4D6D instead of blue
                tabBarInactiveTintColor: theme.colors.placeholder,
                tabBarStyle: {
                    backgroundColor: theme.colors.base200,
                    borderTopColor: theme.colors.border,
                },
                headerStyle: {
                    backgroundColor: theme.colors.base100,
                },
                headerTitleStyle: {
                    fontWeight: "600",
                    color: theme.colors.baseContent,
                },
            }}
        >
            <Tabs.Screen
                name="stumble"
                options={{
                    title: "Stumble",
                    headerRight: () => <HeaderThemeToggle />,
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesomeIcon icon={faShuffle as any} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="saved"
                options={{
                    title: "Saved",
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesomeIcon icon={faBookmark as any} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="lists"
                options={{
                    title: "Lists",
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesomeIcon icon={faList as any} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesomeIcon icon={faGear as any} size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}