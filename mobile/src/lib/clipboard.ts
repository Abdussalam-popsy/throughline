import * as Clipboard from "expo-clipboard";
import { Alert } from "react-native";

/**
 * Copies a contact value (phone / email / url) to the clipboard and confirms it.
 *
 * We copy instead of `Linking.openURL` because the iOS Simulator has no Mail
 * app for `mailto:`, and an unhandled `openURL` rejection trips the Hermes dev
 * inspector and surfaces as a red-box "Unable to open URL" error. Copying always
 * works and lets the user paste the value wherever they need it.
 */
export async function copyContact(value: string, label = "Copied"): Promise<void> {
  await Clipboard.setStringAsync(value);
  Alert.alert(label, `${value} copied to your clipboard.`);
}
