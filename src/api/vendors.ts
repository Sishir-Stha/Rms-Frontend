// Get Vendors
export interface Vendor {
  vendor_id: number
  vendor_name: string
  contact: string
  phone: string
  specialization: string
  rating: string
  created_at: string
}

export interface GetVendorsResponse {
  success: boolean
  message: string
  data: {
    result: Vendor[]
  }
}

// Create Vendor
export interface CreateVendorRequest {
  vendor_name: string
  contact: string
  phone: string
  specialization: string
  rating: number
}

export interface CreateVendorResponse {
  success: boolean
  message: string
  data: {
    vendor_id: number
  }
}

// Update Vendor
export interface UpdateVendorRequest {
  vendor_name: string
  contact: string
  phone: string
  specialization: string
  rating: number
}

export interface UpdateVendorResponse {
  success: boolean
  message: string
  data: {
    result: boolean
  }
}

const API_BASE_URL = 'http://192.168.5.59/api/v1'

export const getVendors = async (vendor_name: string = '', specialization: string = ''): Promise<GetVendorsResponse> => {
  const response = await fetch(`${API_BASE_URL}/vendors?vendor_name=${vendor_name}&specialization=${specialization}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch vendors')
  }

  return response.json()
}


export const createVendor = async (vendorData: CreateVendorRequest): Promise<CreateVendorResponse> => {
  const response = await fetch(`${API_BASE_URL}/vendors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vendorData),
  })

  if (!response.ok) {
    throw new Error('Failed to create vendor')
  }

  return response.json()
}


export const updateVendor = async (vendorId: number, vendorData: UpdateVendorRequest): Promise<UpdateVendorResponse> => {
  const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vendorData),
  })

  if (!response.ok) {
    throw new Error('Failed to update vendor')
  }

  return response.json()
}

// Delete Vendor
export interface DeleteVendorResponse {
  success: boolean
  message: string
  data: {}
}

export const deleteVendor = async (vendorId: number): Promise<DeleteVendorResponse> => {
  const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete vendor')
  }

  return response.json()
}