import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { supabase } from './supabase'; // 使用你已创建的 supabase.ts

// 类型定义
enum IssueCategory {
  TRANSPORTATION = '交通与基础设施',
  TOURISM_PRODUCT = '旅游产品与业态',
  LIVELIHOOD = '三农融合与民生',
  ECOLOGY = '生态保护与治理',
  MANAGEMENT = '运营管理与服务',
  OTHERS = '其他相关问题'
}

type IssueStatus = '待解决' | '处理中' | '已解决' | '待补充';

interface IssueItem {
  id: string;
  category: IssueCategory;
  description: string;
  impact?: string;
  status: IssueStatus;
  remarks?: string;
  created_at?: string;
  last_updated?: string;
}

const App: React.FC = () => {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('issues_table')
      .select('*')
      .order('last_updated', { ascending: false }); // 最近更新优先显示

    if (error) {
      console.error('fetchIssues error', error);
    } else {
      setIssues(data as IssueItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues_table' },
        (payload) => {
          console.log('检测到变更，正在同步...', payload);
          fetchIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, fontFamily: 'Inter, sans-serif' }}>
        <h2>正在连接协作数据库...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Inter, sans-serif' }}>
      <h1>问题看板（最近更新优先）</h1>
      <button onClick={fetchIssues} style={{ marginBottom: 12 }}>刷新</button>
      <ul>
        {issues.map(item => (
          <li key={item.id} style={{ marginBottom: 12, padding: 8, border: '1px solid #ddd', borderRadius: 6 }}>
            <div><strong>{item.category}</strong> — {item.status}</div>
            <div>{item.description}</div>
            <div style={{ fontSize: 12, color: '#666' }}>最后更新: {item.last_updated ? new Date(item.last_updated).toLocaleString() : '-'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);