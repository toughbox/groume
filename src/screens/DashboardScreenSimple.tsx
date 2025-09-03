import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Button, Card, Avatar, Badge } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from '../store/authSlice';
import { useAppSelector } from '../hooks/useAppDispatch';

interface DashboardScreenProps {
  onCreateMeeting?: () => void;
  onJoinedMeetings?: () => void; // 참가한 미팅 화면으로 이동
  onMeetingList?: () => void; // 미팅 목록 화면으로 이동
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onCreateMeeting,
  onJoinedMeetings,
  onMeetingList,
}) => {
  // Redux에서 user 상태 가져오기
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  
  // 백엔드에서 받은 실제 티켓 개수 사용
  const ticketCount = user?.ticket_count || 0;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('새로고침 완료!');
    }, 1000);
  }, []);

  const handleBuyTickets = () => {
    Alert.alert('준비 중', '결제 시스템을 준비 중입니다.');
  };

  const handleCompleteMission = () => {
    // TODO: 실제 API 호출로 미션 완료 처리
    Alert.alert('미션 완료!', '매칭 이용권 1개를 획득했습니다.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Avatar
              size="medium"
              rounded
              title={user?.username?.charAt(0).toUpperCase() || 'U'}
              source={user?.profile_image_url ? { uri: user.profile_image_url } : undefined}
              containerStyle={styles.avatar}
            />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>안녕하세요, {user?.username || '사용자'}님!</Text>
              <Text style={styles.subText}>오늘도 좋은 만남을 찾아보세요</Text>
            </View>
          </View>
        </View>

        {/* 매칭 이용권 카드 */}
        <Card containerStyle={styles.ticketCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>매칭 이용권</Text>
          </View>
          <View style={styles.ticketContent}>
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketCount}>{ticketCount}</Text>
              <Text style={styles.ticketLabel}>개</Text>
            </View>
            <Button
              title="구매하기"
              onPress={handleBuyTickets}
              buttonStyle={styles.buyButton}
              titleStyle={styles.buyButtonText}
            />
          </View>

          {ticketCount < 3 && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                ⚠️ 이용권이 부족합니다. 미션을 완료하거나 구매해주세요.
              </Text>
            </View>
          )}
        </Card>

        {/* 미션 카드 */}
        <Card containerStyle={styles.missionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>데일리 미션</Text>
            <Badge
              value="3"
              badgeStyle={styles.missionBadge}
              textStyle={styles.badgeText}
            />
          </View>

          {/* 진행 중인 미션 */}
          <View style={styles.missionItem}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionIcon}>⏰</Text>
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>프로필 완성하기</Text>
                <Text style={styles.missionDesc}>자기소개와 관심사를 추가해보세요</Text>
              </View>
              <Text style={styles.missionReward}>+2 🎫</Text>
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>진행률: 2/3</Text>
            </View>
          </View>

          {/* 완료 가능한 미션 */}
          <View style={styles.missionItem}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionIcon}>•</Text>
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>광고 시청하기</Text>
                <Text style={styles.missionDesc}>30초 광고를 끝까지 시청하기</Text>
              </View>
              <Text style={styles.missionReward}>+1 🎫</Text>
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>진행률: 3/3</Text>
            </View>
            <Button
              title="보상 받기"
              buttonStyle={styles.rewardButton}
              titleStyle={styles.rewardButtonText}
              onPress={handleCompleteMission}
            />
          </View>
        </Card>

        {/* 액션 버튼들 */}
        <View style={styles.actionButtonsContainer}>
          {/* 새 미팅 신청 버튼 */}
          <Button
            title="➕ 새 미팅 신청"
            onPress={onCreateMeeting}
            buttonStyle={styles.primaryActionButton}
            titleStyle={styles.primaryActionButtonText}
          />
          
          {/* 미팅 목록 보기 버튼 */}
          <Button
            title="📋 미팅 목록"
            onPress={onMeetingList}
            buttonStyle={styles.tertiaryActionButton}
            titleStyle={styles.tertiaryActionButtonText}
          />
          
          {/* 참가한 미팅 보기 버튼 */}
          <Button
            title="👥 참가한 미팅"
            onPress={onJoinedMeetings}
            buttonStyle={styles.secondaryActionButton}
            titleStyle={styles.secondaryActionButtonText}
          />
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#FF6B6B',
  },
  welcomeContainer: {
    marginLeft: 15,
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  subText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    fontWeight: '400',
  },
  ticketCard: {
    borderRadius: 15,
    margin: 15,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  ticketContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketInfo: {
    alignItems: 'center',
  },
  ticketCount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6B6B',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  ticketLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    fontWeight: '400',
  },
  buyButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  buyButtonText: {
    fontSize: 14,
  },
  warningContainer: {
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  warningText: {
    color: '#E74C3C',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  missionCard: {
    borderRadius: 15,
    margin: 15,
    marginTop: 0,
  },
  missionBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  missionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  missionDesc: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  missionReward: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  progressContainer: {
    marginLeft: 36,
    marginBottom: 10,
  },
  progressText: {
    fontSize: 12,
    color: '#95A5A6',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  rewardButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginLeft: 36,
    alignSelf: 'flex-start',
  },
  rewardButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    paddingHorizontal: 15,
    gap: 10,
  },
  primaryActionButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 15,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  secondaryActionButton: {
    backgroundColor: '#3498DB',
    borderRadius: 25,
    paddingVertical: 15,
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  tertiaryActionButton: {
    backgroundColor: '#9B59B6',
    borderRadius: 25,
    paddingVertical: 15,
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tertiaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  bottomSpace: {
    height: 30,
  },
});

export default DashboardScreen;