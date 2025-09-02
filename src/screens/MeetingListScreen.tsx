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
import { Button, SearchBar, Card, Avatar } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMeetings,
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);

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
    loadMeetings();
  };

  const handleMatchingRequest = async (meeting: Meeting, myMeetingId: string) => {
    if (!myMeetingId) {
      Alert.alert('알림', '먼저 미팅을 생성해주세요.');
      return;
    }

    Alert.prompt(
      '매칭 요청',
      '상대방에게 보낼 메시지를 입력하세요:',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전송',
          onPress: async (message) => {
            try {
              await dispatch(sendMatchingRequest({
                meeting_id: myMeetingId,
                target_meeting_id: meeting.id,
                message: message || '',
              })).unwrap();
              
              Alert.alert('성공', '매칭 요청을 성공적으로 보냈습니다!');
            } catch (error) {
              Alert.alert('오류', error as string || '매칭 요청에 실패했습니다.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.preferred_region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMeetingCard = ({ item }: { item: Meeting }) => (
    <Card containerStyle={styles.cardContainer}>
      <TouchableOpacity
        onPress={() => onMeetingPress?.(item)}
        style={styles.cardContent}
      >
        {/* 헤더 */}
        <View style={styles.cardHeader}>
          <View style={styles.leaderInfo}>
            <Avatar
              rounded
              size="medium"
              source={
                item.leader_profile_image
                  ? { uri: item.leader_profile_image }
                  : undefined
              }
              title={item.leader_name?.[0] || 'U'}
              containerStyle={styles.avatar}
            />
            <View style={styles.leaderDetails}>
              <Text style={styles.leaderName}>{item.leader_name || '익명'}</Text>
              <Text style={styles.leaderMeta}>
                {item.leader_age}세 · {item.leader_region} · ⭐ {item.leader_rating?.toFixed(1) || 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.groupSizeBadge}>
            <Text style={styles.groupSizeText}>{item.group_size}:{item.group_size}</Text>
          </View>
        </View>

        {/* 미팅 정보 */}
        <View style={styles.meetingInfo}>
          <Text style={styles.meetingTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.meetingDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.meetingDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>나이대:</Text>
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

        {/* 액션 버튼 */}
        <View style={styles.actionContainer}>
          <Button
            title="매칭 요청"
            onPress={() => handleMatchingRequest(item, 'your-meeting-id')} // 실제로는 사용자의 활성 미팅 ID 사용
            buttonStyle={styles.requestButton}
            titleStyle={styles.requestButtonText}
            loading={selectedMeeting === item.id}
          />
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>매칭 가능한 미팅</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 검색 바 */}
      <SearchBar
        placeholder="미팅 제목이나 지역으로 검색..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        containerStyle={styles.searchBarContainer}
        inputContainerStyle={styles.searchBarInput}
        searchIcon={{ color: '#FF6B6B' }}
        clearIcon={{ color: '#FF6B6B' }}
        platform={Platform.OS}
      />

      {/* 필터 옵션 (간단한 버전) */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            // 필터 모달 열기 (향후 구현)
            Alert.alert('알림', '필터 기능은 곧 추가될 예정입니다.');
          }}
        >
          <Text style={styles.filterButtonText}>🔍 필터</Text>
        </TouchableOpacity>
        <Text style={styles.resultCount}>{filteredMeetings.length}개의 미팅</Text>
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
              {loading ? '로딩 중...' : '매칭 가능한 미팅이 없습니다.'}
            </Text>
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
  placeholder: {
    width: 44,
  },
  searchBarContainer: {
    backgroundColor: 'white',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBarInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  filterButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  resultCount: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
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
    alignItems: 'center',
    marginBottom: 15,
  },
  leaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  leaderDetails: {
    flex: 1,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  leaderMeta: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  groupSizeBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  groupSizeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  meetingInfo: {
    marginBottom: 15,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  meetingDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  meetingDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    width: 60,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
  },
  requestButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingVertical: 12,
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
});
