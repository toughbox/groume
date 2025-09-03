import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Button, Card, Badge } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { 
  fetchJoinedMeetings,
  leaveMeeting,
  selectJoinedMeetings,
  selectMatchingLoading,
  selectMatchingError,
  clearError
} from '../store/matchingSlice';
import { Meeting } from '../types';

interface JoinedMeetingsScreenProps {
  onBack?: () => void;
  onMeetingPress?: (meeting: Meeting) => void;
}

export const JoinedMeetingsScreen: React.FC<JoinedMeetingsScreenProps> = ({
  onBack,
  onMeetingPress,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const joinedMeetings = useSelector(selectJoinedMeetings);
  const loading = useSelector(selectMatchingLoading);
  const error = useSelector(selectMatchingError);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJoinedMeetings();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('오류', error);
      dispatch(clearError());
    }
  }, [error]);

  const loadJoinedMeetings = () => {
    dispatch(fetchJoinedMeetings());
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadJoinedMeetings();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLeaveMeeting = (meeting: Meeting) => {
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
              loadJoinedMeetings(); // 목록 새로고침
            } catch (error) {
              Alert.alert('오류', error as string || '참가 취소에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const renderMeetingItem = ({ item: meeting }: { item: Meeting }) => (
    <Card containerStyle={styles.card}>
      <TouchableOpacity 
        onPress={() => onMeetingPress?.(meeting)}
        activeOpacity={0.7}
      >
        {/* 미팅 제목 및 상태 */}
        <View style={styles.cardHeader}>
          <Text style={styles.meetingTitle}>{meeting.title}</Text>
          <Badge
            value={meeting.status === 'active' ? '진행중' : '종료'}
            badgeStyle={[
              styles.statusBadge,
              meeting.status === 'active' ? styles.activeBadge : styles.inactiveBadge
            ]}
            textStyle={styles.badgeText}
          />
        </View>

        {/* 미팅 정보 */}
        <View style={styles.meetingInfo}>
          <Text style={styles.infoText}>👥 {meeting.current_members || 0}/{meeting.group_size}명</Text>
          <Text style={styles.infoText}>📍 {meeting.preferred_region}</Text>
          <Text style={styles.infoText}>☕ {meeting.meeting_place}</Text>
          <Text style={styles.infoText}>👤 리더: {meeting.leader_name || meeting.leader_username}</Text>
        </View>

        {/* 나이 및 날짜 */}
        <View style={styles.detailInfo}>
          <Text style={styles.detailText}>나이: {meeting.min_age}~{meeting.max_age}세</Text>
          <Text style={styles.detailText}>
            참가일: {new Date(meeting.joined_at || meeting.created_at).toLocaleDateString('ko-KR')}
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
          <Button
            title="참가 취소"
            buttonStyle={[styles.actionButton, styles.leaveButton]}
            titleStyle={styles.leaveButtonText}
            onPress={() => handleLeaveMeeting(meeting)}
          />
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>참가한 미팅이 없습니다</Text>
      <Text style={styles.emptySubtitle}>다른 사람의 미팅에 참가해보세요!</Text>
      <Button
        title="미팅 둘러보기"
        buttonStyle={styles.browseButton}
        onPress={onBack}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>참가한 미팅</Text>
        {onBack && (
          <Button
            title="뒤로"
            buttonStyle={styles.backButton}
            titleStyle={styles.backButtonText}
            onPress={onBack}
          />
        )}
      </View>

      <FlatList
        data={joinedMeetings}
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
    alignItems: 'center',
    marginBottom: 10,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#9E9E9E',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
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
  detailInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 13,
    color: '#7F8C8D',
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
  leaveButton: {
    backgroundColor: '#E74C3C',
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailButton: {
    backgroundColor: '#3498DB',
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  browseButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
});

export default JoinedMeetingsScreen;
