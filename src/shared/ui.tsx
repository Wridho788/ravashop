import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons/static';
import React, {ComponentProps, ComponentRef, ReactNode, Ref} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import {formatRupiah} from '../domain/money';
import {productImage} from './productImages';
import {colors, radius, space, TOUCH, type} from './theme';

export type IconName = ComponentProps<typeof MaterialDesignIcons>['name'];

export function Icon({name, size = 22, color = colors.ink}: {name: IconName; size?: number; color?: string}) {
  return <MaterialDesignIcons name={name} size={size} color={color} />;
}

type ButtonProps = {
  title: string;
  onPress(): void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  testID,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;
  const palette = {
    primary: {bg: colors.ink, fg: colors.white, border: colors.ink},
    secondary: {bg: colors.surface, fg: colors.ink, border: colors.border},
    danger: {bg: colors.surface, fg: colors.danger, border: colors.danger},
    ghost: {bg: 'transparent', fg: colors.accentDark, border: 'transparent'},
  }[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{disabled: !!inactive, busy: !!loading}}
      disabled={inactive}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        {backgroundColor: palette.bg, borderColor: palette.border},
        inactive && variant === 'primary' && styles.buttonDisabled,
        inactive && variant !== 'primary' && styles.buttonDim,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? <Icon name={icon} size={20} color={palette.fg} /> : null}
          <Text style={[styles.buttonText, {color: palette.fg}]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  testID,
  color = colors.ink,
  disabled,
  filled,
  selected,
}: {
  icon: IconName;
  onPress(): void;
  accessibilityLabel: string;
  testID?: string;
  color?: string;
  disabled?: boolean;
  filled?: boolean;
  selected?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{disabled: !!disabled, selected}}
      hitSlop={4}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.iconButton,
        filled && styles.iconButtonFilled,
        disabled && styles.buttonDim,
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} color={disabled ? colors.disabled : color} />
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected}}
      onPress={onPress}
      style={({pressed}) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  testID: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function TextField({label, error, testID, style, ref, ...input}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View>
        <TextInput
          ref={ref}
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            input.multiline && styles.inputMultiline,
            !!error && styles.inputError,
            styles.inputClearable,
            style,
          ]}
          {...input}
        />
        {input.value && input.onChangeText && input.editable !== false ? (
          <View style={[styles.clear, input.multiline && styles.clearTop]}>
            <IconButton
              testID={`${testID}.clear`}
              icon="close-circle"
              color={colors.muted}
              accessibilityLabel={`Kosongkan ${label}`}
              onPress={() => input.onChangeText?.('')}
            />
          </View>
        ) : null}
      </View>
      {error ? (
        <Text testID={`${testID}.error`} style={styles.fieldError} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function Price({value, style, testID}: {value: number; style?: object; testID?: string}) {
  return (
    <Text testID={testID} style={[type.price, style]}>
      {formatRupiah(value)}
    </Text>
  );
}

/** Square product illustration; without `size` it fills the parent's width. */
export function ProductImage({
  assetKey,
  size,
  rounded = radius.lg,
}: {
  assetKey: string;
  size?: number;
  rounded?: number;
}) {
  const source = productImage(assetKey);
  if (size) {
    return (
      <Image
        source={source}
        accessibilityIgnoresInvertColors
        style={{width: size, height: size, borderRadius: rounded}}
      />
    );
  }
  // Image ignores aspectRatio against its intrinsic size, so a square View sets the box.
  return (
    <View style={[styles.imageFill, {borderRadius: rounded}]}>
      <Image source={source} accessibilityIgnoresInvertColors style={styles.imageAbsolute} />
    </View>
  );
}

export function Card({
  children,
  style,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  return (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  testID,
}: {
  icon: IconName;
  title: string;
  message: string;
  action?: ReactNode;
  testID?: string;
}) {
  return (
    <View testID={testID} style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={36} color={colors.accent} />
      </View>
      <Text style={[type.subtitle, styles.center]}>{title}</Text>
      <Text style={[type.caption, styles.center]}>{message}</Text>
      {action}
    </View>
  );
}

export function Banner({
  tone,
  message,
  testID,
  action,
}: {
  tone: 'error' | 'success' | 'info';
  message: string;
  testID?: string;
  action?: ReactNode;
}) {
  const palette = {
    error: {bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle-outline' as IconName},
    success: {bg: colors.successSoft, fg: colors.success, icon: 'check-circle-outline' as IconName},
    info: {bg: colors.accentSoft, fg: colors.accentDark, icon: 'information-outline' as IconName},
  }[tone];
  return (
    <View
      testID={testID}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={[styles.banner, {backgroundColor: palette.bg}]}
    >
      <Icon name={palette.icon} color={palette.fg} />
      <Text style={[styles.bannerText, {color: palette.fg}]}>{message}</Text>
      {action}
    </View>
  );
}

export function SimulationLabel({testID}: {testID?: string}) {
  return (
    <Banner tone="info" testID={testID} message="Simulasi — tidak ada pembayaran atau pengiriman nyata." />
  );
}

export function Loading({label = 'Memuat…'}: {label?: string}) {
  return (
    <View style={styles.loading} accessibilityLabel={label}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

export function LoadError({message, onRetry}: {message: string; onRetry(): void}) {
  return (
    <View style={styles.loading}>
      <Banner tone="error" message={message} />
      <Button title="Coba lagi" onPress={onRetry} variant="secondary" testID="load.retry" />
    </View>
  );
}

export function Row({
  label,
  value,
  strong,
  testID,
}: {
  label: string;
  value: string;
  strong?: boolean;
  testID?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={[type.body, strong && styles.strong, styles.rowLabel]}>{label}</Text>
      <Text testID={testID} style={[type.body, strong && styles.strongValue]}>
        {value}
      </Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
  buttonText: {fontSize: 16, fontWeight: '700', textAlign: 'center'},
  buttonDisabled: {backgroundColor: colors.disabled, borderColor: colors.disabled},
  buttonDim: {opacity: 0.45},
  pressed: {opacity: 0.75},
  iconButton: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonFilled: {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border},
  chip: {
    minHeight: 40,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipSelected: {backgroundColor: colors.ink, borderColor: colors.ink},
  chipText: {fontSize: 14, fontWeight: '600', color: colors.ink},
  chipTextSelected: {color: colors.white},
  field: {gap: space.xs},
  fieldLabel: {fontSize: 14, fontWeight: '700', color: colors.ink},
  input: {
    minHeight: TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 16,
    color: colors.ink,
  },
  inputMultiline: {minHeight: 96, textAlignVertical: 'top'},
  inputError: {borderColor: colors.danger},
  inputClearable: {paddingRight: TOUCH},
  clear: {position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center'},
  clearTop: {bottom: undefined},
  fieldError: {fontSize: 13, color: colors.danger},
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  empty: {alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.md, flexGrow: 1},
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {textAlign: 'center'},
  imageFill: {width: '100%', aspectRatio: 1, overflow: 'hidden'},
  imageAbsolute: {position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'},
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
  },
  bannerText: {flex: 1, fontSize: 14, fontWeight: '600'},
  loading: {flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: space.lg, padding: space.xl},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md},
  rowLabel: {flexShrink: 1},
  strong: {fontWeight: '800'},
  strongValue: {fontWeight: '800', fontSize: 18},
});
