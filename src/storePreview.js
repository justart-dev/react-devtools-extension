export const previewLogs = [
  {
    level: 'error',
    timestamp: '2025-01-15T14:06:12.000Z',
    payload: [
      'Checkout submission failed',
      {
        code: 'PAYMENT_TIMEOUT',
        retryable: true,
        requestId: 'req_17A92K',
      },
    ],
  },
  {
    level: 'warn',
    timestamp: '2025-01-15T14:05:44.000Z',
    payload: ['Feature flag "promo_banner" returned fallback variation'],
  },
  {
    level: 'info',
    timestamp: '2025-01-15T14:05:18.000Z',
    payload: ['Session restored for user', { plan: 'pro', locale: 'en-US' }],
  },
  {
    level: 'log',
    timestamp: '2025-01-15T14:04:51.000Z',
    payload: ['Rendered <CartSummary /> in 42ms'],
  },
];

export const previewRequests = [
  {
    method: 'POST',
    statusCode: 200,
    url: 'https://api.taillog.dev/v1/events?source=checkout',
    timestamp: '2025-01-15T14:06:03.000Z',
    payload: {
      event: 'checkout_submit',
      cartId: 'cart_18x92',
      itemCount: 3,
    },
    response: {
      ok: true,
      jobId: 'job_77af2',
    },
  },
  {
    method: 'GET',
    statusCode: 304,
    url: 'https://cdn.taillog.dev/assets/runtime.js',
    timestamp: '2025-01-15T14:05:57.000Z',
    payload: '',
    response: '',
  },
  {
    method: 'DELETE',
    statusCode: 204,
    url: 'https://api.taillog.dev/v1/stash/temp?id=clip_203',
    timestamp: '2025-01-15T14:05:40.000Z',
    payload: '',
    response: '',
  },
];

export const previewStashHistory = [
  {
    id: 'stash-1',
    url: 'https://app.taillog.dev/orders/1284',
    timestamp: '2025-01-15T14:04:59.000Z',
    content: 'POST /v1/orders {"orderId":"1284","status":"pending-review","retry":true}',
  },
  {
    id: 'stash-2',
    url: 'https://dashboard.taillog.dev/components/button',
    timestamp: '2025-01-15T14:03:28.000Z',
    content: '<Button variant="ghost" size="sm">Retry payment</Button>',
  },
  {
    id: 'stash-3',
    url: 'https://localhost:5173',
    timestamp: '2025-01-15T14:01:11.000Z',
    content: '.checkout-summary .price-row[data-state="warning"]',
  },
];

export const previewLocatorSettings = {
  preferredIDE: 'cursor',
  isEnabled: true,
};
