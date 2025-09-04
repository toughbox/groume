/**
 * 환경별 설정 파일
 * 집/회사에서 IP 주소 변경이 필요할 때 이 파일만 수정하면 됩니다.
 */

// 현재 사용할 IP 주소 설정
// 집: '192.168.0.19'
// 회사: '192.168.206.171'
const CURRENT_IP = '192.168.206.171'; // 🔧 이 부분만 변경하세요!

const PORT = '3030';

export const API_CONFIG = {
  BASE_URL: `http://${CURRENT_IP}:${PORT}/api`,
  IP_ADDRESS: CURRENT_IP,
  PORT: PORT,
  
  // 전체 URL들
  AUTH_BASE_URL: `http://${CURRENT_IP}:${PORT}/api/auth`,
  MATCHING_BASE_URL: `http://${CURRENT_IP}:${PORT}/api/matching`,
  TICKETS_BASE_URL: `http://${CURRENT_IP}:${PORT}/api/tickets`,
  REVIEWS_BASE_URL: `http://${CURRENT_IP}:${PORT}/api/reviews`,
  
  // React Native 개발 서버용 URL
  RN_DEV_URL: `http://${CURRENT_IP}:19006`,
};

// 개발용 로그
console.log('🌐 현재 API 설정:', {
  IP: API_CONFIG.IP_ADDRESS,
  BASE_URL: API_CONFIG.BASE_URL,
});

export default API_CONFIG;
