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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Badge } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyMeetings,
  cancelMeeting,
  selectMyMeetings,
  selectMatchingLoading,
  selectMatchingError,
  clearError,
} from '../store/matchingSlice';
import { AppDispatch } from '../store';
import { Meeting } from '../types';

interface MyMeetingsScreenProps {
  onBack: () => void;
  onCreateNew?: () => void;
  onMeetingPress?: (meeting: Meeting) => void;
}

export const MyMeetingsScreen: React.FC<MyMeetingsScreenProps> = ({
  onBack,
  onCreateNew,
  onMeetingPress,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const meetings = useSelector(selectMyMeetings);
  const loading = useSelector(selectMatchingLoading);
  const error = useSelector(selectMatchingError);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadMeetings();
  }, [selectedStatus]);

  useEffect(() => {
    if (error) {
      Alert.alert('오류', error);
      dispatch(clearError());
    }
  }, [error]);

  const loadMeetings = () => {
    const params = selectedStatus === 'all' ? {} : { status: selectedStatus };
    dispatch(fetchMyMeetings(params));
  };

  const handleRefresh = () => {
    loadMeetings();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'matched':
        return '#FF6B6B';
      case 'completed':
        return '#2196F3';
      case 'cancelled':
        return '#9E9E9E';
      case 'expired':
        return '#FFC107';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'matched':
        return '매칭됨';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      case 'expired':
        return '만료';
      default:
        return '알 수 없음';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredMeetings = selectedStatus === 'all' 
    ? meetings 
    : meetings.filter(meeting => meeting.status === selectedStatus);

  const statusOptions = [
    { key: 'all', label: '전체', count: meetings.length },
    { key: 'active', label: '활성', count: meetings.filter(m => m.status === 'active').length },
    { key: 'matched', label: '매칭됨', count: meetings.filter(m => m.status === 'matched').length },
    { key: 'completed', label: '완료', count: meetings.filter(m => m.status === 'completed').length },
  ];

  const renderMeetingCard = ({ item }: { item: Meeting }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expires_at);
    const isExpiringSoon = daysUntilExpiry <= 2 && item.status === 'active';

    return (
      <Card containerStyle={styles.cardContainer}>
        <TouchableOpacity
          onPress={() => onMeetingPress?.(item)}
          style={styles.cardContent}
        >
          {/* 헤더 */}
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.meetingTitle}>{item.title}</Text>
              {isExpiringSoon && (
                <Badge
                  value="곧 만료"
                  status="warning"
                  containerStyle={styles.warningBadge}
                  textStyle={styles.warningBadgeText}
                />
              )}
            </View>
            <Badge
              value={getStatusText(item.status)}
              badgeStyle={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
              textStyle={styles.statusText}
            />
          </View>

          {/* 미팅 정보 */}
          <View style={styles.meetingInfo}>
            {item.description && (
              <Text style={styles.meetingDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            <View style={styles.meetingDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>인원:</Text>
                <Text style={styles.detailValue}>
                  {item.group_size}:{item.group_size} (확정: {item.confirmed_members_count || 1})
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>나이:</Text>
                <Text style={styles.detailValue}>{item.min_age}-{item.max_age}세</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>지역:</Text>
                <Text style={styles.detailValue}>{item.preferred_region}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>장소:</Text>
                <Text style={styles.detailValue}>{item.meeting_place}</Text>
              </View>
            </View>
          </View>

          {/* 통계 정보 */}
          {item.status === 'active' && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{(item as any).pending_requests_count || 0}</Text>
                <Text style={styles.statLabel}>대기중 요청</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {daysUntilExpiry > 0 ? `${daysUntilExpiry}일` : '만료'}
                </Text>
                <Text style={styles.statLabel}>남은 기간</Text>
              </View>
            </View>
          )}

          {/* 시간 정보 */}
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>
              생성: {formatDate(item.created_at)}
            </Text>
            {item.status === 'active' && (
              <Text style={[
                styles.timeText,
                isExpiringSoon && styles.expiryWarning
              ]}>
                만료: {formatDate(item.expires_at)}
              </Text>
            )}
          </View>

          {/* 액션 버튼 (활성 상태 미팅만) */}
          {item.status === 'active' && (
            <View style={styles.actionContainer}>
              <Button
                title="미팅 취소"
                buttonStyle={styles.cancelButton}
                titleStyle={styles.cancelButtonText}
                onPress={(e) => {
                  e.stopPropagation(); // 카드 클릭 이벤트와 분리
                  handleCancelMeeting(item);
                }}
              />
            </View>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 미팅</Text>
        <TouchableOpacity onPress={onCreateNew} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 상태 필터 */}
      <View style={styles.filterContainer}>
        <FlatList
          data={statusOptions}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedStatus === item.key && styles.selectedFilterButton
              ]}
              onPress={() => setSelectedStatus(item.key)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedStatus === item.key && styles.selectedFilterButtonText
              ]}>
                {item.label} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* 미팅 목록 */}
      <FlatList
        data={filteredMeetings}
        keyExtractor={(item) => item.id}
        renderItem={renderMeetingCard}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? '로딩 중...' : '생성한 미팅이 없습니다.'}
            </Text>
            {!loading && (
              <Button
                title="첫 미팅 만들기"
                onPress={onCreateNew}
                buttonStyle={styles.createButton}
                titleStyle={styles.createButtonText}
              />
            )}
          </View>
        }
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
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FF6B6B',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
  },
  filterList: {
    paddingHorizontal: 20,
  },
  filterButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedFilterButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    fontWeight: '500',
  },
  selectedFilterButtonText: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cardContainer: {
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 0,
  },
  cardContent: {
    padding: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    flex: 1,
  },
  warningBadge: {
    marginLeft: 8,
  },
  warningBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  meetingInfo: {
    marginBottom: 15,
  },
  meetingDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  meetingDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    width: 50,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 15,
  },
  timeInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  expiryWarning: {
    color: '#FFA500',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  createButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  actionContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
