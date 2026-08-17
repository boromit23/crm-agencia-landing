async function checkAll() {
  const endpoints = [
    '/api/health',
    '/api/leads',
    '/api/sales',
    '/api/analytics',
    '/api/analytics/activity',
    '/api/auth/devices',
    '/api/settings'
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch('https://crm-agencia-landing.vercel.app' + ep);
      const text = await res.text();
      console.log(res.status + ' ' + ep + ' -> ' + text.slice(0, 150));
    } catch (e) {
      console.log('ERR ' + ep + ' -> ' + e.message);
    }
  }
}
checkAll();
