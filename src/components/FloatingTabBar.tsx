import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';
import {COLORS, TabKey} from '../theme/colors';
import {
  HomeIcon,
  CompassIcon,
  HeartIcon,
  ChatIcon,
  UserIcon,
} from './AppIcons';

interface FloatingTabBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  unreadChatCount?: number;
}

const TABS: {key: TabKey; label: string}[] = [
  {key: 'inicio', label: 'Inicio'},
  {key: 'planes', label: 'Planes'},
  {key: 'recuerdos', label: 'Amor'},
  {key: 'chat', label: 'Chat'},
  {key: 'perfil', label: 'Pareja'},
];

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  activeTab,
  onSelectTab,
  unreadChatCount = 0,
}) => {
  const renderIcon = (key: TabKey, isActive: boolean) => {
    const iconColor = isActive ? COLORS.goldLight : COLORS.goldMuted;
    switch (key) {
      case 'inicio':
        return <HomeIcon color={iconColor} size={21} filled={false} />;
      case 'planes':
        return <CompassIcon color={iconColor} size={22} />;
      case 'recuerdos':
        return <HeartIcon color={iconColor} size={21} filled={false} />;
      case 'chat':
        return <ChatIcon color={iconColor} size={21} />;
      case 'perfil':
        return <UserIcon color={iconColor} size={22} />;
    }
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.pillContainer}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              onPress={() => onSelectTab(tab.key)}
              style={styles.tabTouch}>
              <View
                style={[
                  styles.iconCircle,
                  isActive && styles.iconCircleActive,
                ]}>
                {renderIcon(tab.key, isActive)}
                {tab.key === 'chat' && unreadChatCount > 0 && !isActive && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadChatCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 20,
    left: 22,
    right: 22,
    alignItems: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 42,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 14,
  },
  tabTouch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(212, 175, 90, 0.16)',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: COLORS.wineDark,
    fontSize: 10,
    fontWeight: '800',
  },
});

