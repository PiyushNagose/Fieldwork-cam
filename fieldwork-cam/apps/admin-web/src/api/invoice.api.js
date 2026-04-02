import { apiClient } from "./client";

export const getInvoicesApi = async (params = {}) => {
  const response = await apiClient.get("/invoices", { params });
  return response.data;
};

export const createInvoiceApi = async (payload) => {
  const response = await apiClient.post("/invoices/create", payload);
  return response.data;
};

export const getInvoiceByIdApi = async (invoiceId) => {
  const response = await apiClient.get(`/invoices/${invoiceId}`);
  return response.data;
};