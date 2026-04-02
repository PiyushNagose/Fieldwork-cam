import { getProjectsApi } from "./project.api";
import { getVendorsApi } from "./vendor.api";
import { getInvoicesApi } from "./invoice.api";
import { getServicesApi } from "./service.api";

export const getAnalyticsDependenciesApi = async () => {
  const [projects, vendors, invoices, services] = await Promise.allSettled([
    getProjectsApi(),
    getVendorsApi(),
    getInvoicesApi(),
    getServicesApi(),
  ]);

  return {
    projects,
    vendors,
    invoices,
    services,
  };
};
