import Vehicle from '../models/vehicle.model.js';

// @desc    Get paginated, filtered vehicle logs
// @route   GET /api/reports
// @access  Private (Admin Only)
export const getReports = async (req, res) => {
    try {
        const { startDate, endDate, vehicleType, page = 1, limit = 20 } = req.query;

        const query = {};

        // 1. Date Filter Logic
        // We ensure we cover the FULL day (00:00:00 to 23:59:59)
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            query.entryTime = { $gte: start, $lte: end };
        }

        // 2. Vehicle Type Filter
        if (vehicleType && vehicleType !== 'All') {
            query.vehicleType = vehicleType;
        }

        // 3. Pagination Logic
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        // 4. Fetch Data & Count Total (Parallel Execution)
        // We need 'total' to show the "Page 1 of 5" at the bottom of the table
        const [records, total] = await Promise.all([
            Vehicle.find(query)
                .populate('recordedBy', 'username') // Join with User table to show who added it
                .sort({ entryTime: -1 }) // Newest first
                .limit(limitNum)
                .skip(skip),
            Vehicle.countDocuments(query)
        ]);

        // 5. Send Response
        res.json({
            success: true,
            data: records,
            pagination: {
                totalRecords: total,
                totalPages: Math.ceil(total / limitNum),
                currentPage: pageNum,
            }
        });

    } catch (error) {
        console.error(`Report Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error fetching reports' });
    }
};
// @desc    Get stats for Admin Dashboard (Any Date)
// @route   GET /api/reports/dashboard?date=YYYY-MM-DD
// @access  Private (Admin Only)
export const getDashboardStats = async (req, res) => {
    try {
        const { date } = req.query;

        // 1. Determine the Date Range
        // If user sends ?date=2023-10-05, use it. Otherwise, use Today.
        const selectedDate = date ? new Date(date) : new Date();

        // Validate date (in case user sends garbage text)
        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid Date Format' });
        }

        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // --- Execute Parallel Queries ---
        const [totalVehicles, vehicleDistribution, recentActivity] = await Promise.all([
            
            // Query 1: Total Count for the specific day
            Vehicle.countDocuments({ 
                entryTime: { $gte: startOfDay, $lte: endOfDay } 
            }),

            // Query 2: Breakdown by Type for the specific day
            Vehicle.aggregate([
                { $match: { entryTime: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: "$vehicleType", count: { $sum: 1 } } }
            ]),

            // Query 3: Recent Activity (Show specifically for that day)
            // Note: If you look at past dates, "recent" means "last entries of that day"
            Vehicle.find({ 
                entryTime: { $gte: startOfDay, $lte: endOfDay } 
            })
            .sort({ entryTime: -1 }) // Latest first
            .limit(5)
            .select('plateNumber vehicleType entryTime')
        ]);

        // Format aggregation result
        const statsMap = {};
        vehicleDistribution.forEach(item => {
            statsMap[item._id] = item.count;
        });

        res.json({
            success: true,
            selectedDate: startOfDay.toDateString(), // Send back readable date so UI knows what it's showing
            stats: {
                total: totalVehicles,
                typeBreakdown: {
                    twoWheeler: statsMap['2-Wheeler'] || 0,
                    fourWheeler: statsMap['4-Wheeler'] || 0,
                    others: statsMap['Other'] || 0 // Ensure this matches your Enum string exactly
                },
                recentActivity
            }
        });

    } catch (error) {
        console.error(`Dashboard Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error fetching stats' });
    }
};