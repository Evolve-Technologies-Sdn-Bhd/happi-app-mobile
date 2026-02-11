/**
 * Task API - Ported from happi-app-customer/src/api/customer/task.js
 */
import { httpRequest } from './client';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: number;
  type: number;
  dueDate?: string;
  completedDate?: string;
}

export interface UpdateTaskStatusData {
  id: string;
  status: number;
}

/**
 * Get customer unfinished task list
 */
export const getCustomerUnfinishedTaskList = (params?: Record<string, any>) => {
  return httpRequest<Task[]>({
    method: 'GET',
    url: '/v1/customer/task/app/list',
    params,
  });
};

/**
 * Update customer task status
 */
export const updateCustomerTaskStatus = (data: UpdateTaskStatusData) => {
  return httpRequest({
    method: 'PUT',
    url: '/v1/customer/task/app/status/update',
    data,
  });
};

export default {
  getCustomerUnfinishedTaskList,
  updateCustomerTaskStatus,
};
