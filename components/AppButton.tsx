import { Pressable, Text } from "react-native";
import { globalStyles } from "../styles/globalStyles";

type Props = {
    title: string;
    onPress: () => void;
    type?: "primary" | "ghost";
};

export default function AppButton({ title, onPress, type = "primary" }: Props) {
    const isPrimary = type === "primary";

    return (
        <Pressable
      onPress= { onPress }
    style = { isPrimary? globalStyles.primaryButton : globalStyles.ghostButton }
        >
        <Text
        style={
        isPrimary
            ? globalStyles.primaryButtonText
            : globalStyles.ghostButtonText
    }
      >
    { title }
        </Text>
        </Pressable>
  );
}