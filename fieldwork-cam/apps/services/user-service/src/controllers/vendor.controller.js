const vendorService = require("../services/vendor.service");

const getVendors = async (req, res) => {
  try {
    const { status, serviceArea, role, limit, offset } = req.query; // Filters and pagination
    const vendors = await vendorService.getVendors({
      status,
      serviceArea,
      role,
      limit,
      offset,
    });
    res
      .status(200)
      .json({ data: vendors, message: "Vendors fetched successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getVendorById = async (req, res) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);
    res
      .status(200)
      .json({ data: vendor, message: "Vendor fetched successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createVendorByAdmin = async (req, res) => {
  try {
    const data = await vendorService.createVendorByAdmin(
      req.user.userId,
      req.body,
    );
    res.status(201).json({ data, message: "Vendor created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getVendorProfileByAuthUserId = async (req, res) => {
  try {
    const profile = await vendorService.getVendorProfileByAuthUserId(
      req.user.userId,
    );
    return res
      .status(200)
      .json({ data: profile, message: "Vendor profile fetched successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendorByAdmin,
  getVendorProfileByAuthUserId,
};
