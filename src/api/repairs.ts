// Get Repairs (List)
export interface GetRepairsRequest {
  status: string
  device_name: string
}

export interface Repair {
  repair_id: number
  device_name: string
  category_name: string
  serial_no: string
  department_name: string
  issue: string
  notes: string | null
  user_name: string
  vendor_name: string
  status: string
  priority: string
  expected_completion: string | null
  resolved_date: string | null
  costs: string
}

export interface GetRepairsResponse {
  success: boolean
  message: string
  data: {
    result: Repair[]
  }
}

export interface SingleRepair {
  repair_id: number
  device_name: string
  category_id: number
  serial_no: string
  department_id: number
  issue: string
  notes: string | null
  reported_by: number
  reported_date: string
  vendor_id: number
  status: string
  priority: string
  expected_completion: string | null
  resolved_date: string | null
  costs: string
  created_at: string
  updated_at: string
}

export interface GetSingleRepairResponse {
  success: boolean
  message: string
  data: {
    result: SingleRepair
  }
}

export interface CreateRepairRequest {
  device_name: string
  category_id: number
  serial_no: string
  department_id: number
  issue: string
  notes: string
  reported_by: number
  vendor_id: number
  priority: string
  expected_completion: string
}

export interface CreateRepairResponse {
  success: boolean
  message: string
  data: {
    repair_id: number
  }
}

// Update Repair
export interface UpdateRepairRequest {
  device_name: string
  category_id: number
  serial_no: string
  department_id: number
  issue: string
  notes: string
  status: string
  reported_by: number
  reported_date: string
  vendor_id: number
  priority: string
  expected_completion: string
  resolved_date: string
  cost: number
}

export interface UpdateRepairResponse {
  success: boolean
  message: string
  data: {
    result: boolean
  }
}

// Delete Repair
export interface DeleteRepairResponse {
  success: boolean
  message: string
  data: {}
}

// Move Repair (Kanban)
export interface MoveRepairRequest {
  status: string
}

export interface MoveRepairResponse {
  success: boolean
  message: string
  data: {
    error?: {
      length: number
      name: string
      severity: string
      code: string
      detail: string
      schema: string
      table: string
      constraint: string
      file: string
      line: string
      routine: string
    }
  }
}

const API_BASE_URL = 'http://l192.168.5.59:4000/api/v1'


export const getRepairs = async (filters: GetRepairsRequest): Promise<GetRepairsResponse> => {
  const response = await fetch(`${API_BASE_URL}/repairs/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch repairs')
  }

  return response.json()
}

// Get Single Repair

export const getSingleRepair = async (repairId: number): Promise<GetSingleRepairResponse> => {
  const response = await fetch(`${API_BASE_URL}/repairs/${repairId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch repair')
  }

  return response.json()
}

// Create Repair


export const createRepair = async (repairData: CreateRepairRequest): Promise<CreateRepairResponse> => {
  const response = await fetch(`${API_BASE_URL}/repairs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(repairData),
  })

  if (!response.ok) {
    throw new Error('Failed to create repair')
  }

  return response.json()
}


export const updateRepair = async (repairId: number, repairData: UpdateRepairRequest): Promise<UpdateRepairResponse> => {
  const response = await fetch(`${API_BASE_URL}/repairs/${repairId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(repairData),
  })

  if (!response.ok) {
    throw new Error('Failed to update repair')
  }

  return response.json()
}



export const moveRepair = async (repairId: number, moveData: MoveRepairRequest): Promise<MoveRepairResponse> => {
  const response = await fetch(`${API_BASE_URL}/repairs/${repairId}/move`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(moveData),
  })

  if (!response.ok) {
    throw new Error('Failed to move repair')
  }

  return response.json()
}



export const deleteRepair = async (repairId: number): Promise<DeleteRepairResponse> => {
  const response = await fetch(`${API_BASE_URL}/repairs/${repairId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete repair')
  }

  return response.json()
}
