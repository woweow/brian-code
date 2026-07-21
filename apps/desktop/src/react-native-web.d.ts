declare module "react-native-web" {
  import type { ComponentType, ReactNode } from "react";

  /** RN-web accepts RN style keys (paddingHorizontal, etc.) plus CSS. */
  export type RNStyle = Record<string, string | number | undefined>;

  export type StyleProp<T> = T | T[] | false | null | undefined;

  export const View: ComponentType<{
    style?: StyleProp<RNStyle>;
    children?: ReactNode;
  }>;
  export const Text: ComponentType<{
    style?: StyleProp<RNStyle>;
    children?: ReactNode;
    numberOfLines?: number;
  }>;
  export const TextInput: ComponentType<{
    style?: StyleProp<RNStyle>;
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    multiline?: boolean;
    editable?: boolean;
  }>;
  export const Pressable: ComponentType<{
    style?: StyleProp<RNStyle | ((state: { pressed: boolean }) => RNStyle)>;
    onPress?: () => void;
    disabled?: boolean;
    children?: ReactNode;
  }>;
  export const ScrollView: ComponentType<{
    style?: StyleProp<RNStyle>;
    children?: ReactNode;
  }>;
  export const ActivityIndicator: ComponentType<{
    style?: StyleProp<RNStyle>;
  }>;

  export const StyleSheet: {
    create<T extends Record<string, RNStyle>>(styles: T): T;
  };
}
