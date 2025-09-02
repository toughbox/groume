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
import { Button, Card, Avatar, Tab, TabView } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReceivedRequests,
  fetchSentRequests,
  respondToMatchingRequest,
  selectReceivedRequests,
  selectSentRequests,
  selectRequestsLoading,
  selectMatchingError,
  clearError,
} from '../store/matchingSlice';
import { AppDispatch } from '../store';
import { MatchingRequest } from '../types';

interface MatchingRequestsScreenProps {
  onBack: () => void;
}

export const MatchingRequestsScreen: React.FC<MatchingRequestsScreenProps> = ({
  onBack,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const receivedRequests = useSelector(selectReceivedRequests);
  const sentRequests = useSelector(selectSentRequests);
  const loading = useSelector(selectRequestsLoading);
  const error = useSelector(selectMatchingError);

  const [activeTab, setActiveTab] = useState(0);
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('오류', error);
      dispatch(clearError());
    }
  }, [error]);

  const loadRequests = () => {
    dispatch(fetchReceivedRequests());
    dispatch(fetchSentRequests());
  };

  const handleRefresh = () => {
    loadRequests();
  };

  const handleAcceptRequest = async (requestId: string) => {
    setRespondingRequestId(requestId);
    try {
      await dispatch(respondToMatchingRequest({
        requestId,
        response: { action: 'accept' }
      })).unwrap();
      
      Alert.alert('성공', '매칭 요청을 수락했습니다! 채팅방이 생성되었습니다.');
    } catch (error) {
      Alert.alert('오류', error as string || '요청 수락에 실패했습니다.');
    } finally {
      setRespondingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.alert(
      '매칭 요청 거절',
      '정말로 이 매칭 요청을 거절하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          style: 'destructive',
          onPress: async () => {
            setRespondingRequestId(requestId);
            try {
              await dispatch(respondToMatchingRequest({
                requestId,
                response: { action: 'reject' }
              })).unwrap();
              
              Alert.alert('완료', '매칭 요청을 거절했습니다.');
            } catch (error) {
              Alert.alert('오류', error as string || '요청 거절에 실패했습니다.');
            } finally {
              setRespondingRequestId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'accepted':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'expired':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기중';
      case 'accepted':
        return '수락됨';
      case 'rejected':
        return '거절됨';
      case 'expired':
        return '만료됨';
      default:
        return '알 수 없음';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '1일 전';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  const renderReceivedRequest = ({ item }: { item: MatchingRequest }) => (
    <Card containerStyle={styles.cardContainer}>
      <View style={styles.cardContent}>
        {/* 헤더 */}
        <View style={styles.cardHeader}>
          <View style={styles.requesterInfo}>
            <Avatar
              rounded
              size="medium"
              source={
                item.requester_profile_image
                  ? { uri: item.requester_profile_image }
                  : undefined
              }
              title={item.requester_name?.[0] || 'U'}
              containerStyle={styles.avatar}
            />
            <View style={styles.requesterDetails}>
              <Text style={styles.requesterName}>{item.requester_name || '익명'}</Text>
              <Text style={styles.requestTime}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {/* 미팅 정보 */}
        <View style={styles.meetingInfo}>
          <Text style={styles.meetingTitle}>
            {item.meeting_title} ({item.meeting_group_size}:{item.meeting_group_size})
          </Text>
          <Text style={styles.meetingRegion}>📍 {item.meeting_region}</Text>
          
          <Text style={styles.arrowText}>⬇️</Text>
          
          <Text style={styles.targetMeetingTitle}>
            {item.target_meeting_title} ({item.target_meeting_group_size}:{item.target_meeting_group_size})
          </Text>
          <Text style={styles.targetMeetingRegion}>📍 {item.target_meeting_region}</Text>
        </View>

        {/* 메시지 */}
        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>메시지:</Text>
            <Text style={styles.messageText}>"{item.message}"</Text>
          </View>
        )}

        {/* 액션 버튼 (대기중인 요청만) */}
        {item.status === 'pending' && (
          <View style={styles.actionContainer}>
            <Button
              title="거절"
              onPress={() => handleRejectRequest(item.id)}
              buttonStyle={[styles.actionButton, styles.rejectButton]}
              titleStyle={styles.rejectButtonText}
              loading={respondingRequestId === item.id}
              disabled={respondingRequestId !== null}
            />
            <Button
              title="수락"
              onPress={() => handleAcceptRequest(item.id)}
              buttonStyle={[styles.actionButton, styles.acceptButton]}
              titleStyle={styles.acceptButtonText}
              loading={respondingRequestId === item.id}
              disabled={respondingRequestId !== null}
            />
          </View>
        )}
      </View>
    </Card>
  );

  const renderSentRequest = ({ item }: { item: MatchingRequest }) => (
    <Card containerStyle={styles.cardContainer}>
      <View style={styles.cardContent}>
        {/* 헤더 */}
        <View style={styles.cardHeader}>
          <View style={styles.requesterInfo}>
            <Avatar
              rounded
              size="medium"
              source={
                item.target_leader_profile_image
                  ? { uri: item.target_leader_profile_image }
                  : undefined
              }
              title={item.target_leader_name?.[0] || 'U'}
              containerStyle={styles.avatar}
            />
            <View style={styles.requesterDetails}>
              <Text style={styles.requesterName}>{item.target_leader_name || '익명'}</Text>
              <Text style={styles.requestTime}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {/* 미팅 정보 */}
        <View style={styles.meetingInfo}>
          <Text style={styles.meetingTitle}>
            {item.meeting_title} ({item.meeting_group_size}:{item.meeting_group_size})
          </Text>
          <Text style={styles.meetingRegion}>📍 {item.meeting_region}</Text>
          
          <Text style={styles.arrowText}>⬇️</Text>
          
          <Text style={styles.targetMeetingTitle}>
            {item.target_meeting_title} ({item.target_meeting_group_size}:{item.target_meeting_group_size})
          </Text>
          <Text style={styles.targetMeetingRegion}>📍 {item.target_meeting_region}</Text>
        </View>

        {/* 메시지 */}
        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>보낸 메시지:</Text>
            <Text style={styles.messageText}>"{item.message}"</Text>
          </View>
        )}

        {/* 응답 시간 */}
        {item.responded_at && (
          <View style={styles.responseInfo}>
            <Text style={styles.responseTime}>
              {getStatusText(item.status)} · {formatDate(item.responded_at)}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>매칭 요청</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 탭 */}
      <Tab
        value={activeTab}
        onChange={setActiveTab}
        indicatorStyle={styles.tabIndicator}
        variant="primary"
      >
        <Tab.Item
          title={`받은 요청 (${receivedRequests.length})`}
          titleStyle={activeTab === 0 ? styles.activeTabTitle : styles.inactiveTabTitle}
          buttonStyle={activeTab === 0 ? styles.activeTab : styles.inactiveTab}
        />
        <Tab.Item
          title={`보낸 요청 (${sentRequests.length})`}
          titleStyle={activeTab === 1 ? styles.activeTabTitle : styles.inactiveTabTitle}
          buttonStyle={activeTab === 1 ? styles.activeTab : styles.inactiveTab}
        />
      </Tab>

      {/* 탭 내용 */}
      <TabView value={activeTab} onChange={setActiveTab} animationType="spring">
        <TabView.Item style={styles.tabContent}>
          <FlatList
            data={receivedRequests}
            keyExtractor={(item) => item.id}
            renderItem={renderReceivedRequest}
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
                  {loading ? '로딩 중...' : '받은 매칭 요청이 없습니다.'}
                </Text>
              </View>
            }
          />
        </TabView.Item>
        <TabView.Item style={styles.tabContent}>
          <FlatList
            data={sentRequests}
            keyExtractor={(item) => item.id}
            renderItem={renderSentRequest}
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
                  {loading ? '로딩 중...' : '보낸 매칭 요청이 없습니다.'}
                </Text>
              </View>
            }
          />
        </TabView.Item>
      </TabView>
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
  tabIndicator: {
    backgroundColor: '#FF6B6B',
    height: 3,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  inactiveTab: {
    backgroundColor: 'white',
  },
  activeTabTitle: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 14,
  },
  inactiveTabTitle: {
    color: '#7F8C8D',
    fontWeight: '500',
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  requesterDetails: {
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  requestTime: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  meetingInfo: {
    marginBottom: 15,
    alignItems: 'center',
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  meetingRegion: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  arrowText: {
    fontSize: 20,
    marginVertical: 8,
  },
  targetMeetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  targetMeetingRegion: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  messageContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  messageLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  messageText: {
    fontSize: 14,
    color: '#2C3E50',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  rejectButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  rejectButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  acceptButton: {
    backgroundColor: '#FF6B6B',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  responseInfo: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  responseTime: {
    fontSize: 12,
    color: '#7F8C8D',
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
