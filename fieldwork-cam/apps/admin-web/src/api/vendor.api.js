import { apiClient } from "./client";

// Fetch all vendors with optional filters and pagination
export const getVendorsApi = async (params = {}) => {
  const response = await apiClient.get("/vendors", { params });
  return response.data;
};

// Fetch a specific vendor by ID
export const getVendorByIdApi = async (vendorId) => {
  const response = await apiClient.get(`/vendors/${vendorId}`);
  return response.data;
};

// Fetch the vendor profile of the logged-in user
export const getVendorProfileByAuthUserIdApi = async () => {
  const response = await apiClient.get("/vendors/me/profile");
  return response.data;
};

export const updateVendorProfileApi = async (payload) => {
  const response = await apiClient.put("/vendors/me/profile", payload);
  return response.data;
};

// Admin creates a new vendor (invites user and creates vendor profile)
export const createVendorByAdminApi = async (payload) => {
  const response = await apiClient.post("/vendors/admin/create", payload);
  return response.data;
};
