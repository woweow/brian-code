declare module "react-native-web" {
  import type {
    ComponentType,
    ForwardRefExoticComponent,
    ReactNode,
    RefAttributes,
  } from "react";

  /** RN-web accepts RN style keys (paddingHorizontal, etc.) plus CSS. */
  export type RNStyle = Record<string, string | number | undefined>;

  export type StyleProp<T> = T | T[] | false | null | undefined;

  export type ScrollViewHandle = {
    scrollToEnd: (options?: { animated?: boolean }) => void;
  };

  export const View: ComponentType<{
    style?: StyleProp<RNStyle>;
    children?: ReactNode;
    pointerEvents?: "auto" | "none" | "box-none" | "box-only";
  }>;
  export const Text: ComponentType<{
    style?: StyleProp<RNStyle>;
    children?: ReactNode;
    numberOfLines?: number;
  }>;
  export const TextInput: ComponentType<{
    style?: StyleProp<RNStyle>;
    value?: string;
    onChangeText?: ((text: string) => void) | undefined;
    placeholder?: string;
    multiline?: boolean;
    editable?: boolean;
    onBlur?: (() => void) | undefined;
    onKeyPress?: (event: {
      key: string;
      shiftKey: boolean;
      preventDefault: () => void;
    }) => void;
  }>;
  export const Pressable: ComponentType<{
    style?: StyleProp<RNStyle | ((state: { pressed: boolean }) => RNStyle)>;
    onPress?: () => void;
    onHoverIn?: () => void;
    onHoverOut?: () => void;
    disabled?: boolean;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    children?: ReactNode;
  }>;
  export const ScrollView: ForwardRefExoticComponent<
    {
      style?: StyleProp<RNStyle>;
      children?: ReactNode;
    } & RefAttributes<ScrollViewHandle>
  >;
  export const ActivityIndicator: ComponentType<{
    style?: StyleProp<RNStyle>;
  }>;

  export const StyleSheet: {
    create<T extends Record<string, RNStyle>>(styles: T): T;
  };
}
