import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Avatar, Badge } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMeetings,
  joinMeeting,
  leaveMeeting,
  cancelMeeting,
  sendMatchingRequest,
  selectMeetings,
  selectMeetingsLoading,
  selectMatchingError,
  selectFilters,
  setFilters,
  clearError,
} from '../store/matchingSlice';
import { AppDispatch } from '../store';
import { Meeting } from '../types';
import { useAppSelector } from '../hooks/useAppDispatch';

interface MeetingListScreenProps {
  onBack: () => void;
  onMeetingPress?: (meeting: Meeting) => void;
}

export const MeetingListScreen: React.FC<MeetingListScreenProps> = ({
  onBack,
  onMeetingPress,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const meetings = useSelector(selectMeetings);
  const loading = useSelector(selectMeetingsLoading);
  const error = useSelector(selectMatchingError);
  const filters = useSelector(selectFilters);
  const { user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [joiningMeetingId, setJoiningMeetingId] = useState<string | null>(null);

  useEffect(() => {
    loadMeetings();
  }, [filters]);

  useEffect(() => {
    if (error) {
      Alert.alert('오류', error);
      dispatch(clearError());
    }
  }, [error]);

  const loadMeetings = () => {
    dispatch(fetchMeetings(filters));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMeetings();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleJoinMeeting = async (meeting: Meeting) => {
    if (!user) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }

    // 자신의 미팅인지 확인
    if (meeting.leader_id === user.id) {
      Alert.alert('알림', '자신이 생성한 미팅에는 참가할 수 없습니다.');
      return;
    }

    // 이미 참가한 미팅인지 확인
    if (meeting.is_joined) {
      Alert.alert('알림', '이미 참가한 미팅입니다.');
      return;
    }

    // 정원이 가득 찬 경우 (group_size는 한 팀 인원, 총 인원은 group_size * 2)
    const maxMembers = meeting.group_size * 2;
    if ((meeting.current_members || 0) >= maxMembers) {
      Alert.alert('알림', '참가 인원이 가득 찼습니다.');
      return;
    }

    // 나이 조건 확인
    if (user.age < meeting.min_age || user.age > meeting.max_age) {
      Alert.alert('알림', `나이 조건에 맞지 않습니다. (${meeting.min_age}세 ~ ${meeting.max_age}세)`);
      return;
    }

    // 남녀 비율 확인
    const maleCount = meeting.male_count || 0;
    const femaleCount = meeting.female_count || 0;
    
    if (user.gender === 'male' && maleCount >= meeting.group_size) {
      Alert.alert('알림', `남성 참가자가 가득 찼습니다.\n(현재: 남성 ${maleCount}명 / ${meeting.group_size}명)`);
      return;
    }
    
    if (user.gender === 'female' && femaleCount >= meeting.group_size) {
      Alert.alert('알림', `여성 참가자가 가득 찼습니다.\n(현재: 여성 ${femaleCount}명 / ${meeting.group_size}명)`);
      return;
    }

    Alert.alert(
      '미팅 참가',
      `"${meeting.title}" 미팅에 참가하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '참가',
          onPress: async () => {
            setJoiningMeetingId(meeting.id);
            try {
              await dispatch(joinMeeting(meeting.id)).unwrap();
              Alert.alert('성공', '미팅 참가가 완료되었습니다!');
              loadMeetings(); // 목록 새로고침
            } catch (error) {
              Alert.alert('오류', error as string || '미팅 참가에 실패했습니다.');
            } finally {
              setJoiningMeetingId(null);
            }
          },
        },
      ]
    );
  };

  const handleLeaveMeeting = async (meeting: Meeting) => {
    Alert.alert(
      '참가 취소',
      `"${meeting.title}" 미팅 참가를 취소하시겠습니까?`,
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(leaveMeeting(meeting.id)).unwrap();
              Alert.alert('완료', '미팅 참가가 취소되었습니다.');
              loadMeetings(); // 목록 새로고침
            } catch (error) {
              Alert.alert('오류', error as string || '참가 취소에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleCancelMeeting = (meeting: Meeting) => {
    Alert.alert(
      '미팅 취소',
      `"${meeting.title}" 미팅을 취소하시겠습니까?\n\n⚠️ 다른 참가자가 있는 경우 가장 먼저 참가한 분에게 리더가 위임됩니다.`,
      [
        { 
          text: '아니오', 
          style: 'cancel' 
        },
        {
          text: '예, 취소하기',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await dispatch(cancelMeeting(meeting.id)).unwrap();
              
              if (result.action === 'cancelled') {
                Alert.alert('완료', '미팅이 취소되었습니다.');
              } else if (result.action === 'transferred') {
                Alert.alert(
                  '리더 위임 완료', 
                  `미팅 리더가 ${result.new_leader.name}님에게 위임되었습니다.`
                );
              }
              
              loadMeetings(); // 목록 새로고침
            } catch (error) {
              Alert.alert('오류', error as string || '미팅 취소에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const filteredMeetings = meetings.filter((meeting) =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.preferred_region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMeetingItem = ({ item: meeting }: { item: Meeting }) => {
    const isMyMeeting = user && meeting.leader_id === user.id;
    const isJoined = meeting.is_joined;
    const maxMembers = meeting.group_size * 2;
    const isFull = (meeting.current_members || 0) >= maxMembers;
    const isAgeMatch = user && user.age >= meeting.min_age && user.age <= meeting.max_age;
    
    // 남녀 비율 체크
    const maleCount = meeting.male_count || 0;
    const femaleCount = meeting.female_count || 0;
    const userGender = user?.gender;
    const isGenderFull = userGender === 'male' 
      ? maleCount >= meeting.group_size
      : userGender === 'female' 
        ? femaleCount >= meeting.group_size
        : false;

    return (
      <Card containerStyle={styles.card}>
        <TouchableOpacity 
          onPress={() => onMeetingPress?.(meeting)}
          activeOpacity={0.7}
        >
          {/* 미팅 헤더 */}
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.meetingTitle}>{meeting.title}</Text>
              {isMyMeeting && (
                <Badge
                  value="내 미팅"
                  badgeStyle={styles.myMeetingBadge}
                  textStyle={styles.badgeText}
                />
              )}
            </View>
            <View style={styles.memberInfo}>
              <Text style={[
                styles.memberCount,
                isFull ? styles.fullMemberCount : styles.availableMemberCount
              ]}>
                남성:{meeting.male_count || 0} / 여성:{meeting.female_count || 0}
              </Text>
              <Text style={styles.memberLabel}>
                ({meeting.current_members || 0}/{meeting.group_size * 2}명)
              </Text>
            </View>
          </View>

          {/* 리더 정보 */}
          <View style={styles.leaderInfo}>
            <Avatar
              rounded
              size={30}
              title={(meeting.leader_name || meeting.leader_username || 'U').charAt(0).toUpperCase()}
              containerStyle={styles.leaderAvatar}
            />
            <Text style={styles.leaderName}>
              리더: {meeting.leader_name || meeting.leader_username}
            </Text>
          </View>

          {/* 미팅 정보 */}
          <View style={styles.meetingInfo}>
            <Text style={styles.infoText}>📍 {meeting.preferred_region}</Text>
            <Text style={styles.infoText}>☕ {meeting.meeting_place}</Text>
            <Text style={styles.infoText}>👥 나이: {meeting.min_age}~{meeting.max_age}세</Text>
            <Text style={styles.infoText}>
              📅 {new Date(meeting.created_at).toLocaleDateString('ko-KR')}
            </Text>
          </View>

          {/* 설명 */}
          {meeting.description && (
            <Text style={styles.description} numberOfLines={2}>
              {meeting.description}
            </Text>
          )}

          {/* 액션 버튼 */}
          <View style={styles.actionButtons}>
            {isMyMeeting ? (
              <Button
                title="미팅 취소"
                buttonStyle={[styles.actionButton, styles.cancelButton]}
                titleStyle={styles.cancelButtonText}
                onPress={() => handleCancelMeeting(meeting)}
              />
            ) : isJoined ? (
              <Button
                title="참가 취소"
                buttonStyle={[styles.actionButton, styles.leaveButton]}
                titleStyle={styles.leaveButtonText}
                onPress={() => handleLeaveMeeting(meeting)}
              />
            ) : (
              <Button
                title={
                  isFull ? '정원 마감' :
                  isGenderFull ? `${userGender === 'male' ? '남성' : '여성'} 자리 마감` :
                  !isAgeMatch ? '나이 조건 불충족' :
                  joiningMeetingId === meeting.id ? '참가 중...' : '참가 신청'
                }
                buttonStyle={[
                  styles.actionButton,
                  isFull || isGenderFull || !isAgeMatch ? styles.disabledButton : styles.joinButton
                ]}
                titleStyle={[
                  isFull || isGenderFull || !isAgeMatch ? styles.disabledButtonText : styles.joinButtonText
                ]}
                disabled={isFull || isGenderFull || !isAgeMatch || joiningMeetingId === meeting.id}
                loading={joiningMeetingId === meeting.id}
                onPress={() => handleJoinMeeting(meeting)}
              />
            )}
            
            <Button
              title="자세히 보기"
              buttonStyle={[styles.actionButton, styles.detailButton]}
              titleStyle={styles.detailButtonText}
              onPress={() => onMeetingPress?.(meeting)}
            />
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>미팅이 없습니다</Text>
      <Text style={styles.emptySubtitle}>새로운 미팅을 만들어보세요!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>미팅 목록</Text>
        <Button
          title="뒤로"
          buttonStyle={styles.backButton}
          titleStyle={styles.backButtonText}
          onPress={onBack}
        />
      </View>

      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="미팅 제목이나 지역으로 검색..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
      </View>

      {/* 미팅 목록 */}
      <FlatList
        data={filteredMeetings}
        renderItem={renderMeetingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF6B6B"
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  backButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listContainer: {
    padding: 15,
  },
  card: {
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  myMeetingBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  memberInfo: {
    alignItems: 'center',
    minWidth: 50,
  },
  memberCount: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  availableMemberCount: {
    color: '#4CAF50',
  },
  fullMemberCount: {
    color: '#E74C3C',
  },
  memberLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  leaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  leaderAvatar: {
    backgroundColor: '#FF6B6B',
    marginRight: 8,
  },
  leaderName: {
    fontSize: 14,
    color: '#5D6D7E',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  meetingInfo: {
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#5D6D7E',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  description: {
    fontSize: 14,
    color: '#5D6D7E',
    lineHeight: 20,
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
  },
  joinButton: {
    backgroundColor: '#4CAF50',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  leaveButton: {
    backgroundColor: '#E74C3C',
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
  },
  disabledButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  detailButton: {
    backgroundColor: '#3498DB',
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
});

export default MeetingListScreen;