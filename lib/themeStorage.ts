// lib/themeStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeMode } from "../store/slices/themeSlice";

const THEME_KEY = "app_theme";

export async function saveTheme(theme: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.warn("Failed to save theme", e);
  }
}

export async function loadTheme(): Promise<ThemeMode | null> {
  try {
    const stored = await AsyncStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return null;
  } catch (e) {
    console.warn("Failed to load theme", e);
    return null;
  }
}