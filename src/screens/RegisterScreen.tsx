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

    // 아이디 검증 (영문+숫자만, 3-20자)
    if (!formData.username.trim()) {
      newErrors.username = '아이디를 입력해주세요';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = '아이디는 영문과 숫자만 입력 가능합니다';
    } else if (formData.username.length < 3) {
      newErrors.username = '아이디는 최소 3자 이상이어야 합니다';
    } else if (formData.username.length > 20) {
      newErrors.username = '아이디는 최대 20자까지 입력 가능합니다';
    }

    // 이메일 검증 (영문 이메일만)
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = '이메일은 영문으로만 입력 가능합니다';
    }

    // 비밀번호 검증 (영문+숫자+특수문자, 8-50자)
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    } else if (formData.password.length > 50) {
      newErrors.password = '비밀번호는 최대 50자까지 입력 가능합니다';
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(formData.password)) {
      newErrors.password = '비밀번호는 영문, 숫자, 특수문자(@$!%*?&)를 포함해야 합니다';
    }

    // 비밀번호 확인
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    // 이름 검증 (한글만, 2-10자)
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    } else if (!/^[가-힣]+$/.test(formData.name)) {
      newErrors.name = '이름은 한글만 입력 가능합니다';
    } else if (formData.name.length < 2) {
      newErrors.name = '이름은 최소 2자 이상이어야 합니다';
    } else if (formData.name.length > 10) {
      newErrors.name = '이름은 최대 10자까지 입력 가능합니다';
    }

    // 나이 검증 (숫자만, 18-100세)
    if (!formData.age) {
      newErrors.age = '나이를 입력해주세요';
    } else if (!/^\d+$/.test(formData.age)) {
      newErrors.age = '나이는 숫자만 입력 가능합니다';
    } else {
      const ageNum = parseInt(formData.age);
      if (ageNum < 18) {
        newErrors.age = '나이는 18세 이상이어야 합니다';
      } else if (ageNum > 100) {
        newErrors.age = '나이는 100세 이하여야 합니다';
      }
    }

    // 성별 검증
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요' as any;
    }

    // 지역 검증
    if (!formData.region) {
      newErrors.region = '지역을 선택해주세요';
    }

    // 전화번호 검증 (선택사항, 숫자와 하이픈만)
    if (formData.phone && !/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = '전화번호는 숫자와 하이픈(-)만 입력 가능합니다';
    }

    // 자기소개 길이 검증 (선택사항, 최대 500자)
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = '자기소개는 최대 500자까지 입력 가능합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    let filteredValue = value;

    // 필드별 실시간 입력 제한 (한글 입력 조합 과정 고려)
    switch (field) {
      case 'username':
        // 아이디: 영문+숫자만, 최대 20자
        filteredValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
        break;
      case 'email':
        // 이메일: 영문+숫자+특수문자(@.-_+%), 최대 100자
        filteredValue = value.replace(/[^a-zA-Z0-9@.\-_+%]/g, '').slice(0, 100);
        break;
      case 'name':
        // 이름: 한글만, 최대 10자 (한글 조합 과정 허용)
        // 완성된 한글만 체크하지 않고 길이만 제한
        filteredValue = value.slice(0, 10);
        break;
      case 'age':
        // 나이: 숫자만, 최대 3자리
        filteredValue = value.replace(/[^0-9]/g, '').slice(0, 3);
        break;
      case 'phone':
        // 전화번호: 숫자와 하이픈만, 최대 20자
        filteredValue = value.replace(/[^0-9-]/g, '').slice(0, 20);
        break;
      case 'bio':
        // 자기소개: 최대 500자
        filteredValue = value.slice(0, 500);
        break;
      case 'password':
      case 'confirmPassword':
        // 비밀번호: 영문+숫자+특수문자(@$!%*?&), 최대 50자
        filteredValue = value.replace(/[^A-Za-z\d@$!%*?&]/g, '').slice(0, 50);
        break;
      default:
        filteredValue = value;
    }

    setFormData(prev => ({ ...prev, [field]: filteredValue }));
    
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
              placeholder="영문+숫자 3-20자 (예: user123)"
              maxLength={20}
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
              placeholder="영문 이메일 (예: user@example.com)"
              maxLength={100}
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
              placeholder="영문+숫자+특수문자 8-50자"
              maxLength={50}
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
              maxLength={50}
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
              placeholder="한글 이름 2-10자 (예: 홍길동)"
              maxLength={10}
              autoCapitalize="none"
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
              placeholder="만 나이 18-100세 (예: 25)"
              maxLength={3}
              keyboardType="number-pad"
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
              style={[styles.input, errors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="숫자+하이픈 (예: 010-1234-5678)"
              maxLength={20}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* 자기소개 (선택) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>자기소개</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.bio && styles.inputError]}
              value={formData.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              placeholder="자기소개 최대 500자 (선택사항)"
              maxLength={500}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {formData.bio && (
              <Text style={[styles.errorText, { color: '#666' }]}>
                {formData.bio.length}/500자
              </Text>
            )}
            {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
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
