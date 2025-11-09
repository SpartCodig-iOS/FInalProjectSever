import dns from 'node:dns';
import postgres from 'postgres';

// IPv4 우선 사용 (Node 18+)
dns.setDefaultResultOrder('ipv4first');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Supabase는 sslmode=require 붙은 URL을 주기 때문에
// 보통 옵션 없이 connectionString만 넘겨도 됨.
const sql = postgres(connectionString, {
  // 필요하면 여기 옵션 추가 가능
  // ssl: 'require', // 보통 URL에 ?sslmode=require 있으면 이거도 자동 처리됨
  max: 10,          // 동시 연결 수 (선택)
  idle_timeout: 20, // 초 단위 (선택)
});

export default sql;