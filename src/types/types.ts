import {Timestamp} from '@react-native-firebase/firestore';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserSliceType} from '../redux/user/slice';

export type AuthStackParamList = {
  Login: undefined;
  SignUpUser: undefined;
  SignUpDriver: undefined;
  LoginType: undefined;
  guide: undefined;
  forgetPassword: undefined;
};

export type LoginTypeNavigation = NativeStackScreenProps<
  AuthStackParamList,
  'LoginType'
>;
export type forgetScreenNavigationProps = NativeStackScreenProps<
  AuthStackParamList,
  'forgetPassword'
>;
export type loginScreenNavigationProps = NativeStackScreenProps<
  AuthStackParamList,
  'Login'
>;

export type guideScreenNavigationProps = NativeStackScreenProps<
  AuthStackParamList,
  'guide'
>;

export type signupUserScreenNavigationProps = NativeStackScreenProps<
  AuthStackParamList,
  'SignUpUser'
>;

export type signupdriverScreenNavigationProps = NativeStackScreenProps<
  AuthStackParamList,
  'SignUpDriver'
>;

export type RootBottomTabParams = {
  Home: undefined;
  Profile: undefined;
};
export type RootBottomTabParamsDriver = {
  Home: undefined;
  Ride: undefined;
  Profile: undefined;
};

export type UserStackParamList = {
  BottomTab: NavigatorScreenParams<RootBottomTabParams>;
  SearchRides: undefined;
  EditProfile: undefined;
};

export type SearchRidesScreenNavigationProps = NativeStackScreenProps<
  UserStackParamList,
  'SearchRides'
>;
export type BottomTabScreenNavigationProps = NativeStackScreenProps<
  UserStackParamList,
  'BottomTab'
>;
export type DriverStackParamList = {
  BottomTab: NavigatorScreenParams<RootBottomTabParamsDriver>;
  EditProfile: undefined;
};

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootBottomTabParams, 'Home'>,
  NativeStackScreenProps<UserStackParamList>
>;
export type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootBottomTabParams, 'Profile'>,
  NativeStackScreenProps<UserStackParamList>
>;

export type DriverProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootBottomTabParamsDriver, 'Profile'>,
  NativeStackScreenProps<DriverStackParamList>
>;

// export type DriverEditProfileScreenProps = CompositeScreenProps<
//   BottomTabScreenProps<RootBottomTabParamsDriver>,
//   NativeStackScreenProps<DriverStackParamList, 'EditProfile'>
// >;
// export type UserEditProfileScreenProps = CompositeScreenProps<
//   BottomTabScreenProps<RootBottomTabParams>,
//   NativeStackScreenProps<UserStackParamList, 'EditProfile'>
// >;
export type DriverEditProfileScreenProps = NativeStackScreenProps<
  DriverStackParamList,
  'EditProfile'
>;
export type UserEditProfileScreenProps = NativeStackScreenProps<
  UserStackParamList,
  'EditProfile'
>;
export type MyObjectType = {
  price: number;
  status: string;
  uid: string;
  driverInfo?: UserSliceType;
  dropoffLocation: {
    latitude: number;
    longitude: number;
  };
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  dateTime: Timestamp;
};
