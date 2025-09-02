import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Button, Input, Slider } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { createMeeting, selectMatchingLoading, selectMatchingError } from '../store/matchingSlice';
import { AppDispatch } from '../store';
import { CreateMeetingRequest } from '../types';

interface CreateMeetingScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export const CreateMeetingScreen: React.FC<CreateMeetingScreenProps> = ({ 
  onBack, 
  onSuccess 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectMatchingLoading);
  const error = useSelector(selectMatchingError);

  const [meetingTitle, setMeetingTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupSize, setGroupSize] = useState(3);
  const [ageRange, setAgeRange] = useState([22, 30]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [preferredDates, setPreferredDates] = useState<string[]>([]);

  const regions = ['서울', '경기', '인천', '대전', '세종', '충북', '충남', '부산', '대구', '울산', '경북', '경남', '광주', '전북', '전남', '제주'];
  const meetingPlaces = ['카페', '술집', '식당', '기타'];

  const handleSubmit = async () => {
    if (!meetingTitle || !selectedRegion || !selectedStyle) {
      Alert.alert('입력 확인', '모든 필수 항목을 입력해주세요.');
      return;
    }

    const meetingData: CreateMeetingRequest = {
      title: meetingTitle,
      description,
      group_size: groupSize,
      min_age: ageRange[0],
      max_age: ageRange[1],
      preferred_region: selectedRegion,
      meeting_place: selectedStyle,
      preferred_dates: preferredDates,
    };

    try {
      await dispatch(createMeeting(meetingData)).unwrap();
      Alert.alert('성공', '미팅이 성공적으로 생성되었습니다!', [
        { text: '확인', onPress: onSuccess || onBack }
      ]);
    } catch (error) {
      Alert.alert('오류', error as string || '미팅 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>미팅 신청</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 미팅 정보 입력 */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>미팅 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>미팅 제목 *</Text>
            <Input
              placeholder="미팅 제목을 입력하세요"
              value={meetingTitle}
              onChangeText={setMeetingTitle}
              inputContainerStyle={styles.inputContainer}
              containerStyle={styles.inputWrapper}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>미팅 설명</Text>
            <Input
              placeholder="미팅에 대한 간단한 설명을 입력하세요"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              inputContainerStyle={styles.textAreaContainer}
              containerStyle={styles.inputWrapper}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>미팅 인원: {groupSize}:{groupSize}</Text>
            <Slider
              value={groupSize}
              onValueChange={setGroupSize}
              minimumValue={2}
              maximumValue={5}
              step={1}
              thumbStyle={styles.sliderThumb}
              trackStyle={styles.sliderTrack}
              minimumTrackTintColor="#FF6B6B"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>2:2</Text>
              <Text style={styles.sliderLabel}>5:5</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>선호 나이대: {ageRange[0]}-{ageRange[1]}세</Text>
            <View style={styles.ageSliderContainer}>
              <Text style={styles.ageLabel}>최소 나이: {ageRange[0]}세</Text>
              <Slider
                value={ageRange[0]}
                onValueChange={(value) => setAgeRange([value, ageRange[1]])}
                minimumValue={20}
                maximumValue={39}
                step={1}
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
                minimumTrackTintColor="#FF6B6B"
              />
              <Text style={styles.ageLabel}>최대 나이: {ageRange[1]}세</Text>
              <Slider
                value={ageRange[1]}
                onValueChange={(value) => setAgeRange([ageRange[0], value])}
                minimumValue={20}
                maximumValue={39}
                step={1}
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
                minimumTrackTintColor="#FF6B6B"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>지역 선택 *</Text>
            <View style={styles.optionsContainer}>
              {regions.map((region) => (
                <TouchableOpacity
                  key={region}
                  style={[
                    styles.optionButton,
                    selectedRegion === region && styles.selectedOption
                  ]}
                  onPress={() => setSelectedRegion(region)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedRegion === region && styles.selectedOptionText
                  ]}>
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>미팅 장소 *</Text>
            <View style={styles.optionsContainer}>
              {meetingPlaces.map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.optionButton,
                    selectedStyle === style && styles.selectedOption
                  ]}
                  onPress={() => setSelectedStyle(style)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedStyle === style && styles.selectedOptionText
                  ]}>
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 신청 버튼 */}
        <View style={styles.buttonContainer}>
          <Button
            title="미팅 신청하기"
            onPress={handleSubmit}
            loading={loading}
            buttonStyle={styles.submitButton}
            titleStyle={styles.submitButtonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  placeholder: {
    width: 44,
  },
  formContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  inputWrapper: {
    marginBottom: 0,
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  textAreaContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 80,
  },
  sliderThumb: {
    backgroundColor: '#FF6B6B',
    width: 20,
    height: 20,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  ageSliderContainer: {
    marginTop: 10,
  },
  ageLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedOption: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  optionText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: 'white',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 15,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
});
