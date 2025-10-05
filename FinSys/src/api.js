import { API_BASE_URL } from './config';

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  return response.json(); // { success: true, token: "..." }
}

export async function getUserTransactions(userId, token) {
  const response = await fetch(`${API_BASE_URL}/transactions/user/${userId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Fetching transactions failed: ${response.statusText}`);
  }

  return response.json(); // Array of transactions
}

export async function addTransaction(formData, token) {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData // multipart/form-data
  });

  if (!response.ok) {
    throw new Error(`Adding transaction failed: ${response.statusText}`);
  }

  return response.json();
}
