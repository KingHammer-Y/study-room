(() => {
  const config = window.STUDYROOM_SUPABASE_CONFIG || {};
  let clientPromise;
  window.getStudyRoomClient = function () {
    if (window.studySupabaseClient) return Promise.resolve(window.studySupabaseClient);
    if (!config.url || !config.publishableKey) return Promise.reject(new Error('请先在 supabase-config.js 配置 Supabase URL 和 publishable key'));
    if (!clientPromise) clientPromise = new Promise((resolve, reject) => {
      if (window.supabase?.createClient) return resolve(createClient());
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = () => window.supabase?.createClient ? resolve(createClient()) : reject(new Error('Supabase SDK 加载失败'));
      script.onerror = () => reject(new Error('无法加载 Supabase SDK，请检查网络连接'));
      document.head.append(script);
    });
    return clientPromise;
  };
  function createClient() {
    window.studySupabaseClient = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return window.studySupabaseClient;
  }
})();
