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

interface User {
  id: string;
  username: string;
  profileImage?: string;
}

interface DashboardScreenProps {
  user: User;
  onCreateMeeting: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  onCreateMeeting,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [ticketCount, setTicketCount] = useState(3);

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
    setTicketCount(prev => prev + 1);
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
              title={user.username.charAt(0).toUpperCase()}
              source={user.profileImage ? { uri: user.profileImage } : undefined}
              containerStyle={styles.avatar}
            />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>안녕하세요, {user.username}님!</Text>
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
              <Text style={styles.ticketLabel}>보유 티켓</Text>
            </View>
            <Button
              title="구매하기"
              onPress={handleBuyTickets}
              buttonStyle={styles.buyButton}
              titleStyle={styles.buyButtonText}
            />
          </View>
          {ticketCount === 0 && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                이용권이 부족해요! 미션을 완료하거나 구매해주세요.
              </Text>
            </View>
          )}
        </Card>

        {/* 진행 중인 매칭 */}
        <Card containerStyle={styles.matchingCard}>
          <Text style={styles.sectionTitle}>진행 중인 매칭</Text>
          
          <View style={styles.matchingItem}>
            <View style={styles.matchingHeader}>
              <Badge value="매칭 완료" status="success" />
              <Text style={styles.matchingType}>3:3</Text>
            </View>
            <Text style={styles.matchingDescription}>멋진 상대방을 찾았어요!</Text>
            <View style={styles.matchingDetails}>
              <Text style={styles.detailText}>지역: 강남구</Text>
              <Text style={styles.detailText}>상대방 평균 나이: 25세</Text>
            </View>
            <Button
              title="자세히 보기"
              type="outline"
              buttonStyle={styles.detailButton}
              titleStyle={styles.detailButtonText}
              onPress={() => Alert.alert('준비 중', '매칭 상세 페이지를 준비 중입니다.')}
            />
          </View>

          <View style={styles.matchingItem}>
            <View style={styles.matchingHeader}>
              <Badge value="매칭 대기" status="warning" />
              <Text style={styles.matchingType}>5:5</Text>
            </View>
            <Text style={styles.matchingDescription}>적합한 상대방을 찾고 있어요</Text>
            <View style={styles.matchingDetails}>
              <Text style={styles.detailText}>지역: 홍대</Text>
            </View>
            <Button
              title="자세히 보기"
              type="outline"
              buttonStyle={styles.detailButton}
              titleStyle={styles.detailButtonText}
              onPress={() => Alert.alert('준비 중', '매칭 상세 페이지를 준비 중입니다.')}
            />
          </View>
        </Card>

        {/* 오늘의 미션 */}
        <Card containerStyle={styles.missionCard}>
          <Text style={styles.sectionTitle}>오늘의 미션</Text>
          <Text style={styles.sectionSubtitle}>미션을 완료하고 매칭 이용권을 받아보세요!</Text>
          
          {/* 완료된 미션 */}
          <View style={styles.missionItem}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionIcon}>•</Text>
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>일일 출석 체크</Text>
                <Text style={styles.missionDesc}>매일 앱에 접속해서 출석하기</Text>
              </View>
              <Text style={styles.missionReward}>+1 </Text>
            </View>
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>완료됨</Text>
            </View>
          </View>

          {/* 진행 중인 미션 */}
          <View style={styles.missionItem}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionIcon}>•</Text>
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>친구 초대하기</Text>
                <Text style={styles.missionDesc}>친구를 앱에 초대해서 가입 완료시키기</Text>
              </View>
              <Text style={styles.missionReward}>+3 </Text>
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>진행률: 0/1</Text>
            </View>
            <Button
              title="진행하기"
              type="outline"
              buttonStyle={styles.missionButton}
              titleStyle={styles.missionButtonText}
              onPress={() => Alert.alert('준비 중', '친구 초대 기능을 준비 중입니다.')}
            />
          </View>

          {/* 완료 가능한 미션 */}
          <View style={styles.missionItem}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionIcon}>•</Text>
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>광고 시청하기</Text>
                <Text style={styles.missionDesc}>30초 광고를 끝까지 시청하기</Text>
              </View>
              <Text style={styles.missionReward}>+1 </Text>
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

        {/* 새 미팅 신청 버튼 */}
        <View style={styles.fabContainer}>
          <Button
            title="➕ 새 미팅 신청"
            onPress={onCreateMeeting}
            buttonStyle={styles.fabButton}
            titleStyle={styles.fabButtonText}
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
    fontSize: 12,
    color: '#D32F2F',
    textAlign: 'center',
  },
  matchingCard: {
    borderRadius: 15,
    margin: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 15,
  },
  matchingItem: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  matchingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchingType: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  matchingDescription: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 8,
  },
  matchingDetails: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  detailButton: {
    borderColor: '#FF6B6B',
    borderRadius: 8,
  },
  detailButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  missionCard: {
    borderRadius: 15,
    margin: 15,
  },
  missionItem: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  missionDesc: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  missionReward: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  completedContainer: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  missionButton: {
    borderColor: '#7F8C8D',
    borderRadius: 8,
  },
  missionButtonText: {
    color: '#7F8C8D',
    fontSize: 14,
  },
  rewardButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
  },
  rewardButtonText: {
    fontSize: 14,
  },
  fabContainer: {
    margin: 15,
  },
  fabButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 15,
    paddingVertical: 15,
  },
  fabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
});
