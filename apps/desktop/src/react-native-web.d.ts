declare module "react-native-web" {
  import type { ComponentType, CSSProperties, ReactNode } from "react";

  export type StyleProp<T> = T | T[] | false | null | undefined;

  export const View: ComponentType<{
    style?: StyleProp<CSSProperties>;
    children?: ReactNode;
  }>;
  export const Text: ComponentType<{
    style?: StyleProp<CSSProperties>;
    children?: ReactNode;
  }>;
  export const TextInput: ComponentType<{
    style?: StyleProp<CSSProperties>;
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    multiline?: boolean;
    editable?: boolean;
  }>;
  export type StyleProp<T> = T | T[] | false | null | undefined;

  export const Pressable: ComponentType<{
    style?: StyleProp<CSSProperties | ((state: { pressed: boolean }) => CSSProperties)>;
    onPress?: () => void;
    disabled?: boolean;
    children?: ReactNode;
  }>;
  export const ScrollView: ComponentType<{
    style?: StyleProp<CSSProperties>;
    children?: ReactNode;
  }>;
  export const ActivityIndicator: ComponentType<{
    style?: StyleProp<CSSProperties>;
  }>;

  export const StyleSheet: {
    create<T extends Record<string, CSSProperties>>(styles: T): T;
  };
}
