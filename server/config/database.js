const { Pool } = require('pg');

// PostgreSQL 연결 설정
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'groume_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 30초 후 유휴 연결 종료
  connectionTimeoutMillis: 2000, // 2초 연결 타임아웃
});

// 데이터베이스 연결 테스트
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL 데이터베이스 연결 성공!');
    
    // 기본 테이블 존재 확인
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'groume' 
      AND table_name = 'user'
    `);
    
    if (result.rows.length > 0) {
      console.log('📊 사용자 테이블이 존재합니다.');
    } else {
      console.log('⚠️ 사용자 테이블이 존재하지 않습니다. 마이그레이션을 실행해주세요.');
    }
    
    client.release();
  } catch (err) {
    console.error('❌ 데이터베이스 연결 실패:', err.message);
    process.exit(1);
  }
};

// 서버 시작 시 연결 테스트
testConnection();

// 에러 핸들링
pool.on('error', (err) => {
  console.error('💥 PostgreSQL pool 에러:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('📥 서버 종료 중... 데이터베이스 연결을 정리합니다.');
  await pool.end();
  process.exit(0);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
