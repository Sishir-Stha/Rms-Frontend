export interface DeviceRequest {
  request_id: number;
  display_id: string; // e.g., "REQ-26" or "REQ-26/07/10"
  requested_by: number;
  requested_for?: string | null;
  requester_name: string;
  department_id: number;
  department_name: string;
  device_type: string;
  brand: string;
  reason: string;
  quantity: number;
  priority: string;
  request_date: string;
  approval_status: string;
  approved_by: number | null;
  approver_name: string | null;
  approval_date: string | null;
  fulfilled_date: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  original_request_id: number | null;
  split_info: string | null;
}

export interface AuditLogEntry {
  action: string;
  previous_value: string | null;
  new_value: string | null;
  performed_by_name: string | null;
  performed_at: string;
  notes: string | null;
}

const API_BASE_URL = 'http://192.168.5.59:4000/api/v1';

// --- HELPER: Generate display_id from raw data ---
const generateDisplayId = (request: any): string => {
  if (request.split_info && request.original_request_id) {
    return `REQ-${request.original_request_id}/${request.split_info}`;
  }
  return `REQ-${request.request_id}`;
};

// --- API CALLS ---

export const getDeviceRequests = async (approval_status: string = '', device_type: string = '') => {
  const response = await fetch(`${API_BASE_URL}/device-requests?approval_status=${approval_status}&device_type=${device_type}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to fetch device requests');
  
  const data = await response.json();
  
  // Add display_id to each request in the result array
  if (data.data?.result) {
    data.data.result = data.data.result.map((r: any) => ({
      ...r,
      display_id: generateDisplayId(r)
    }));
  }
  return data;
};

export const getSingleDeviceRequest = async (requestId: number) => {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to fetch device request');
  
  const data = await response.json();
  
  // Add display_id to the single request object
  if (data.data?.result) {
    data.data.result = {
      ...data.data.result,
      display_id: generateDisplayId(data.data.result)
    };
  }
  return data;
};

export const updateDeviceRequest = async (requestId: number, requestData: any) => {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  if (!response.ok) throw new Error('Failed to update device request');
  return response.json();
};

export const approveDeviceRequest = async (requestId: number, approveData: { approval_status: string; approved_by: number }) => {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(approveData)
  });
  if (!response.ok) throw new Error('Failed to approve device request');
  return response.json();
};

export const deleteDeviceRequest = async (requestId: number, deleted_by: number) => {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleted_by })
  });
  if (!response.ok) throw new Error('Failed to delete device request');
  return response.json();
};

export const processSplitFulfillment = async (requestId: number, data: { fulfilled_quantity: number; performed_by: number; notes?: string }) => {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}/split-fulfill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to process split fulfillment');
  }
  return response.json();
};

export const fetchRequestHistory = async (requestId: number): Promise<AuditLogEntry[]> => {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}/history`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to fetch history');
  const data = await response.json();
  return data.data.result;
};