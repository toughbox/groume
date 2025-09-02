const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL 연결 풀 설정
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'groume',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  schema: process.env.DB_SCHEMA || 'groume'
});

// 데이터베이스 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL에 연결되었습니다.');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 에러:', err);
  process.exit(1);
});

// 스키마 설정을 위한 헬퍼 함수
const query = async (text, params) => {
  const start = Date.now();
  const client = await pool.connect();
  
  try {
    // 스키마 설정
    await client.query(`SET search_path TO ${process.env.DB_SCHEMA || 'groume'}`);
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    
    console.log('✅ 쿼리 실행:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ 쿼리 에러:', { text, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

// 트랜잭션 헬퍼 함수
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query(`SET search_path TO ${process.env.DB_SCHEMA || 'groume'}`);
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction
};
