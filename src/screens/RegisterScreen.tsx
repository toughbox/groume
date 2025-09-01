import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { registerUser, clearError } from '../store/authSlice';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import CustomPicker from '../components/CustomPicker';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  age: string;
  gender: 'male' | 'female' | '';
  region: string;
  phone: string;
  bio: string;
}

const RegisterScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    gender: '',
    region: '',
    phone: '',
    bio: '',
  });

  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  const genderOptions = [
    { label: '남성', value: 'male' },
    { label: '여성', value: 'female' },
  ];

  const regionOptions = [
    { label: '서울', value: '서울' },
    { label: '부산', value: '부산' },
    { label: '대구', value: '대구' },
    { label: '인천', value: '인천' },
    { label: '광주', value: '광주' },
    { label: '대전', value: '대전' },
    { label: '울산', value: '울산' },
    { label: '세종', value: '세종' },
    { label: '경기', value: '경기' },
    { label: '강원', value: '강원' },
    { label: '충북', value: '충북' },
    { label: '충남', value: '충남' },
    { label: '전북', value: '전북' },
    { label: '전남', value: '전남' },
    { label: '경북', value: '경북' },
    { label: '경남', value: '경남' },
    { label: '제주', value: '제주' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    // 필수 필드 검증
    if (!formData.username.trim()) {
      newErrors.username = '아이디를 입력해주세요';
    } else if (formData.username.length < 3) {
      newErrors.username = '아이디는 3자 이상이어야 합니다';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }

    if (!formData.age) {
      newErrors.age = '나이를 입력해주세요';
    } else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 100) {
      newErrors.age = '나이는 18세 이상 100세 이하여야 합니다';
    }

    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    if (!formData.region) {
      newErrors.region = '지역을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러가 있다면 입력 시 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 회원가입 성공 시 처리
  useEffect(() => {
    if (isAuthenticated) {
      Alert.alert(
        '회원가입 완료',
        '그루미에 오신 것을 환영합니다!',
        [
          {
            text: '확인',
            onPress: () => {
              // TODO: 메인 화면으로 이동
              console.log('회원가입 완료, 메인 화면으로 이동');
            },
          },
        ]
      );
    }
  }, [isAuthenticated]);

  // 에러 발생 시 처리
  useEffect(() => {
    if (error) {
      Alert.alert('오류', error, [
        {
          text: '확인',
          onPress: () => dispatch(clearError()),
        },
      ]);
    }
  }, [error, dispatch]);

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    // Redux action으로 회원가입 처리
    const registerData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender as 'male' | 'female',
      region: formData.region,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
    };

    dispatch(registerUser(registerData));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>그루미 회원가입</Text>
          <Text style={styles.subtitle}>새로운 만남을 시작해보세요!</Text>
        </View>

        <View style={styles.form}>
          {/* 아이디 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>아이디 *</Text>
            <TextInput
              style={[styles.input, errors.username && styles.inputError]}
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              placeholder="3자 이상의 아이디를 입력하세요"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </View>

          {/* 이메일 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일 *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="example@groume.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* 비밀번호 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호 *</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="8자 이상의 비밀번호"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* 비밀번호 확인 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호 확인 *</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder="비밀번호를 다시 입력하세요"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          {/* 이름 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이름 *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="실명을 입력하세요"
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* 나이 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>나이 *</Text>
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              value={formData.age}
              onChangeText={(value) => handleInputChange('age', value)}
              placeholder="만 나이를 입력하세요"
              keyboardType="numeric"
            />
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>

          {/* 성별 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>성별 *</Text>
            <CustomPicker
              selectedValue={formData.gender}
              onValueChange={(value) => handleInputChange('gender', value)}
              items={genderOptions}
              placeholder="성별을 선택하세요"
              error={!!errors.gender}
            />
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>

          {/* 지역 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>거주 지역 *</Text>
            <CustomPicker
              selectedValue={formData.region}
              onValueChange={(value) => handleInputChange('region', value)}
              items={regionOptions}
              placeholder="지역을 선택하세요"
              error={!!errors.region}
            />
            {errors.region && <Text style={styles.errorText}>{errors.region}</Text>}
          </View>

          {/* 전화번호 (선택) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>전화번호</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="010-1234-5678 (선택사항)"
              keyboardType="phone-pad"
            />
          </View>

          {/* 자기소개 (선택) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>자기소개</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              placeholder="간단한 자기소개를 작성해주세요 (선택사항)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* 회원가입 버튼 */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? '가입 중...' : '회원가입'}
            </Text>
          </TouchableOpacity>

          {/* 로그인 링크 */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#6c5ce7',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ddd6fe',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },

  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#6c5ce7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#b2bec3',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  loginLinkText: {
    fontSize: 16,
    color: '#636e72',
  },
  loginLink: {
    fontSize: 16,
    color: '#6c5ce7',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
