import HR from "../Schema/hrSchema.js";

// Populate database with sample data
export const populateHRData = async (req, res) => {
  const sampleHRs = [
    { name: "John Doe", email: "john@example.com", contact: "+1234567890", position: "HR Manager", company: "TechCorp", location: "New York" },
    { name: "Jane Smith", email: "jane@example.com", contact: "+1987654321", position: "HR Executive", company: "InnovateX", location: "San Francisco" },
    // Add more sample data
  ];

  try {
    await HR.insertMany(sampleHRs);
    res.status(200).json({ message: "HR data inserted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search HR with pagination
export const searchHR = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { company: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const total = await HR.countDocuments(filter);
    const results = await HR.find(filter).skip(skip).limit(limitNumber);

    if (results.length === 0) {
      return res.status(404).json({ message: "No HR details found." });
    }

    res.status(200).json({
      totalRecords: total,
      currentPage: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      hrDetails: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
