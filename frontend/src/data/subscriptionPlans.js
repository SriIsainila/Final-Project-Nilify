export const subscriptionPlans = [
  { id: 'url_1', name: 'Starter', urls: 1, price: 200, duration: '1 month' },
  { id: 'url_10', name: 'Basic', urls: 10, price: 1500, duration: '5 months', featured: true },
  { id: 'url_20', name: 'Standard', urls: 20, price: 3000, duration: '5 months' },
  { id: 'url_35', name: 'Plus', urls: 35, price: 6000, duration: '6 months' },
  { id: 'url_50', name: 'Pro', urls: 50, price: 10000, duration: '1 year' },
]

export const subscriptionPlansById = Object.fromEntries(subscriptionPlans.map((plan) => [plan.id, plan]))
