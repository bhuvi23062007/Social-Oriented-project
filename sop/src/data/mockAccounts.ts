export interface MockAccount {
  email: string
  password: string
  name: string
  role: 'user' | 'cleaner' | 'admin'
}

export const mockAccounts: MockAccount[] = [
  { email: 'priya@cleancity.com', password: 'user123', name: 'Priya Sharma', role: 'user' },
  { email: 'karthik@cleancity.com', password: 'cleaner123', name: 'Karthik Raj', role: 'cleaner' },
  { email: 'divya@cleancity.com', password: 'admin123', name: 'Divya Menon', role: 'admin' },
]