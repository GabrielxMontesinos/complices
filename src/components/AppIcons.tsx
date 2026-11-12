import React from 'react';
import {View, StyleSheet} from 'react-native';

interface IconProps {
  color: string;
  size?: number;
  filled?: boolean;
}

/**
 * Icono 1 del menú flotante: Casa / Inicio
 */
export const HomeIcon: React.FC<IconProps> = ({color, size = 22, filled}) => {
  return (
    <View style={[styles.iconBox, {width: size, height: size}]}>
      {/* Techo */}
      <View
        style={[
          styles.homeRoof,
          {
            width: size * 0.68,
            height: size * 0.68,
            borderColor: color,
            marginTop: size * 0.14,
          },
          filled ? {backgroundColor: color} : styles.transparentBg,
        ]}
      />
      {/* Base de la casa */}
      <View
        style={[
          styles.homeBase,
          {
            width: size * 0.72,
            height: size * 0.52,
            borderColor: color,
            marginTop: -size * 0.42,
          },
          filled ? [styles.homeBaseFilled, {backgroundColor: color}] : styles.homeBaseOutline,
        ]}>
        {/* Puerta */}
        <View
          style={[
            styles.homeDoor,
            {
              width: size * 0.22,
              height: size * 0.26,
            },
            filled ? styles.doorFilled : {backgroundColor: color},
          ]}
        />
      </View>
    </View>
  );
};

/**
 * Icono 2 del menú flotante: Brújula / Citas, Retos y Planes
 */
export const CompassIcon: React.FC<IconProps> = ({color, size = 22}) => {
  return (
    <View style={[styles.iconBox, {width: size, height: size}]}>
      <View
        style={[
          styles.compassRing,
          {
            width: size * 0.88,
            height: size * 0.88,
            borderRadius: size * 0.44,
            borderColor: color,
          },
        ]}>
        {/* Aguja de brújula */}
        <View
          style={[
            styles.compassNeedle,
            {
              width: size * 0.34,
              height: size * 0.34,
              borderColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

/**
 * Icono 3 del menú flotante: Corazón / Amor & Recuerdos
 */
export const HeartIcon: React.FC<IconProps> = ({color, size = 22, filled}) => {
  const lobeSize = size * 0.48;
  return (
    <View style={[styles.iconBox, {width: size, height: size}]}>
      <View
        style={[
          styles.heartBase,
          {
            width: size * 0.56,
            height: size * 0.56,
            borderColor: color,
            marginTop: size * 0.12,
          },
          filled ? {backgroundColor: color} : styles.transparentBg,
        ]}>
        <View
          style={[
            styles.heartLeftLobe,
            {
              width: lobeSize,
              height: lobeSize,
              borderRadius: lobeSize / 2,
              borderColor: color,
              top: -lobeSize * 0.52,
            },
            filled ? {backgroundColor: color} : styles.transparentBg,
          ]}
        />
        <View
          style={[
            styles.heartRightLobe,
            {
              width: lobeSize,
              height: lobeSize,
              borderRadius: lobeSize / 2,
              borderColor: color,
              left: -lobeSize * 0.52,
            },
            filled ? {backgroundColor: color} : styles.transparentBg,
          ]}
        />
      </View>
    </View>
  );
};

/**
 * Icono 4 del menú flotante: Burbuja de Chat con puntos (...)
 */
export const ChatIcon: React.FC<IconProps> = ({color, size = 22}) => {
  return (
    <View style={[styles.iconBox, {width: size, height: size}]}>
      <View
        style={[
          styles.chatBubble,
          {
            width: size * 0.86,
            height: size * 0.68,
            borderColor: color,
          },
        ]}>
        <View style={[styles.chatDot, {backgroundColor: color}]} />
        <View style={[styles.chatDot, {backgroundColor: color}]} />
        <View style={[styles.chatDot, {backgroundColor: color}]} />
      </View>
      {/* Cola del globo de chat */}
      <View
        style={[
          styles.chatTail,
          {
            width: size * 0.24,
            height: size * 0.2,
            borderColor: color,
            marginTop: -size * 0.11,
          },
        ]}
      />
    </View>
  );
};

/**
 * Icono 5 del menú flotante: Perfil de Usuario en círculo
 */
export const UserIcon: React.FC<IconProps> = ({color, size = 22}) => {
  return (
    <View style={[styles.iconBox, {width: size, height: size}]}>
      <View
        style={[
          styles.userCircle,
          {
            width: size * 0.88,
            height: size * 0.88,
            borderRadius: size * 0.44,
            borderColor: color,
          },
        ]}>
        {/* Cabeza */}
        <View
          style={[
            styles.userHead,
            {
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: size * 0.15,
              borderColor: color,
            },
          ]}
        />
        {/* Hombros */}
        <View
          style={[
            styles.userShoulders,
            {
              width: size * 0.56,
              height: size * 0.25,
              borderTopLeftRadius: size * 0.28,
              borderTopRightRadius: size * 0.28,
              borderColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeRoof: {
    borderTopWidth: 2.2,
    borderLeftWidth: 2.2,
    transform: [{rotate: '45deg'}],
    borderTopLeftRadius: 3,
  },
  homeBase: {
    borderWidth: 2.2,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeDoor: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  compassRing: {
    borderWidth: 2.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassNeedle: {
    borderWidth: 1.8,
    borderRadius: 2,
    transform: [{rotate: '45deg'}],
  },
  heartBase: {
    borderBottomWidth: 2.2,
    borderRightWidth: 2.2,
    transform: [{rotate: '45deg'}],
    position: 'relative',
  },
  heartLeftLobe: {
    position: 'absolute',
    borderTopWidth: 2.2,
    borderLeftWidth: 2.2,
    left: -2,
  },
  heartRightLobe: {
    position: 'absolute',
    borderTopWidth: 2.2,
    borderRightWidth: 2.2,
    top: -2,
  },
  chatBubble: {
    borderRadius: 6,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 2,
  },
  chatDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  chatTail: {
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{rotate: '45deg'}],
    backgroundColor: 'transparent',
  },
  userCircle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  userHead: {
    borderWidth: 1.8,
    marginBottom: 2,
  },
  userShoulders: {
    borderWidth: 1.8,
    borderBottomWidth: 0,
  },
  transparentBg: {
    backgroundColor: 'transparent',
  },
  homeBaseFilled: {
    borderTopWidth: 2.2,
  },
  homeBaseOutline: {
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  doorFilled: {
    backgroundColor: '#E8D8C4',
  },
});
