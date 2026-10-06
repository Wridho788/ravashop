import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {DefaultTheme, NavigationContainer, NavigatorScreenParams} from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
import {AddressFormScreen} from '../features/addresses/AddressFormScreen';
import {AddressListScreen} from '../features/addresses/AddressListScreen';
import {CartScreen} from '../features/cart/CartScreen';
import {CatalogScreen} from '../features/catalog/CatalogScreen';
import {ProductDetailScreen} from '../features/catalog/ProductDetailScreen';
import {CheckoutScreen} from '../features/checkout/CheckoutScreen';
import {OrderDetailScreen} from '../features/orders/OrderDetailScreen';
import {OrdersScreen} from '../features/orders/OrdersScreen';
import {ProfileScreen} from '../features/profile/ProfileScreen';
import {WishlistScreen} from '../features/wishlist/WishlistScreen';
import {Icon, IconName} from '../shared/ui';
import {colors} from '../shared/theme';
import {useShop} from './ShopContext';

export type TabParamList = {
  Home: undefined;
  Wishlist: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetail: {productId: string};
  Checkout: undefined;
  Addresses: {mode: 'manage' | 'select'};
  AddressForm: {addressId?: string; selectForCheckout?: boolean};
  OrderDetail: {orderId: string; justPlaced?: boolean};
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, [IconName, IconName]> = {
  Home: ['home-variant', 'home-variant-outline'],
  Wishlist: ['heart', 'heart-outline'],
  Cart: ['shopping', 'shopping-outline'],
  Orders: ['receipt-text', 'receipt-text-outline'],
  Profile: ['account-circle', 'account-circle-outline'],
};

const TAB_TITLES: Record<keyof TabParamList, string> = {
  Home: 'Beranda',
  Wishlist: 'Wishlist',
  Cart: 'Keranjang',
  Orders: 'Pesanan',
  Profile: 'Profil',
};

const tabIcon =
  (name: keyof TabParamList) =>
  ({focused, color}: {focused: boolean; color: string}) => (
    <Icon name={TAB_ICONS[name][focused ? 0 : 1]} color={color} size={24} />
  );

function Tabs() {
  const {cartCount} = useShop();
  return (
    <Tab.Navigator
      backBehavior="initialRoute"
      screenOptions={({route}) => ({
        title: TAB_TITLES[route.name],
        tabBarIcon: tabIcon(route.name),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarButtonTestID: `tab.${route.name.toLowerCase()}`,
        tabBarLabelStyle: {fontSize: 12, fontWeight: '600'},
        tabBarStyle: {backgroundColor: colors.surface, borderTopColor: colors.border},
        headerStyle: {backgroundColor: colors.background},
        headerShadowVisible: false,
        headerTitleStyle: {fontWeight: '800', color: colors.ink},
        sceneStyle: {backgroundColor: colors.background},
      })}
    >
      <Tab.Screen name="Home" component={CatalogScreen} options={{headerShown: false}} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {backgroundColor: colors.accent},
          tabBarAccessibilityLabel: cartCount > 0 ? `Keranjang, ${cartCount} barang` : 'Keranjang',
        }}
      />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{title: 'Profil'}} />
    </Tab.Navigator>
  );
}

const theme = {
  ...DefaultTheme,
  colors: {...DefaultTheme.colors, background: colors.background, primary: colors.accent, text: colors.ink},
};

export function AppNavigation() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: colors.background},
          headerShadowVisible: false,
          headerTitleStyle: {fontWeight: '800', color: colors.ink},
          headerTintColor: colors.ink,
          contentStyle: {backgroundColor: colors.background},
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{headerShown: false}} />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{title: 'Detail produk'}}
        />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{title: 'Checkout'}} />
        <Stack.Screen
          name="Addresses"
          component={AddressListScreen}
          options={({route}) => ({title: route.params.mode === 'select' ? 'Pilih alamat' : 'Alamat saya'})}
        />
        <Stack.Screen
          name="AddressForm"
          component={AddressFormScreen}
          options={({route}) => ({title: route.params.addressId ? 'Ubah alamat' : 'Tambah alamat'})}
        />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{title: 'Detail pesanan'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
