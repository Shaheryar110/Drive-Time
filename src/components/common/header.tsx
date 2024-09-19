import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {HStack} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {images} from '../../constant';
type IProps = {
  heading: string;
};

const Header: React.FunctionComponent<IProps> = ({heading}) => {
  return (
    <HStack
      justifyContent="space-between"
      alignItems="center"
      paddingHorizontal={'4%'}
      paddingVertical={20}
      backgroundColor="white">
      <View>
        <Image source={{uri: images.logo}} style={styles.logo}></Image>
      </View>
      <Text style={styles.heading}>{heading}</Text>
      <FontAwesome name="bell" size={25} color={'black'} />
    </HStack>
  );
};

export default Header;

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    color: 'black',
    fontWeight: '600',
  },
  logo: {
    height: 40,
    width: 40,
  },
});
