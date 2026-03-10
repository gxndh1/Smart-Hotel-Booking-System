import LoyaltyAccount from '../models/loyalty.model.js';

// @desc    Get loyalty account for current user
// @route   GET /api/loyalty/:userId or GET /api/loyalty/me
// @access  Private
export const getLoyalty = async (req, res) => {
  try {
    // If userId param is 'me', use current user id, otherwise use the param
    const userId = req.params.userId === 'me' ? req.user.id : (req.params.userId || req.user.id);
    const account = await LoyaltyAccount.findOne({ userId: userId });
    if (!account) {
      // Return default account if not found
      return res.status(200).json({ 
        success: true, 
        data: {
          pointsBalance: 0,
          redemptionPointsBalance: 0,
          history: [],
          lastUpdated: new Date()
        }
      });
    }
    return res.status(200).json({ success: true, data: account });
  } catch (error) {
    console.error('Get loyalty error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get loyalty history
// @route   GET /api/loyalty/history/:userId or GET /api/loyalty/history/me
// @access  Private
export const getLoyaltyHistory = async (req, res) => {
  try {
    const userId = req.params.userId === 'me' ? req.user.id : (req.params.userId || req.user.id);
    const account = await LoyaltyAccount.findOne({ userId: userId });
    if (!account) {
      return res.status(200).json({ 
        success: true, 
        data: {
          pointsBalance: 0,
          redemptionPointsBalance: 0,
          history: []
        }
      });
    }
    return res.status(200).json({ success: true, data: account });
  } catch (error) {
    console.error('Get loyalty history error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update loyalty points (internal - called by payment/booking)
// @route   PUT /api/loyalty/:userId
// @access  Private (internal)
export const updateLoyalty = async (req, res) => {
  try {
    const { pointsBalance } = req.body;
    const account = await LoyaltyAccount.findOne({ userId: req.params.userId });
    
    if (!account) {
      const newAccount = await LoyaltyAccount.create({
        userId: req.params.userId,
        pointsBalance: pointsBalance || 0,
      });
      return res.status(201).json({ success: true, data: newAccount });
    }

    if (pointsBalance !== undefined) account.pointsBalance = pointsBalance;
    account.lastUpdated = new Date();
    await account.save();
    return res.status(200).json({ success: true, data: account });
  } catch (error) {
    console.error('Update loyalty error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Add points to loyalty account
// @route   POST /api/loyalty/add-points
// @access  Private (internal)
export const addPoints = async (req, res) => {
  try {
    const { userId, points } = req.body;

    if (!userId || points === undefined) {
      return res.status(400).json({ success: false, message: 'userId and points are required' });
    }

    let account = await LoyaltyAccount.findOne({ userId });
    if (!account) {
      account = await LoyaltyAccount.create({
        userId,
        pointsBalance: points,
        redemptionPointsBalance: 0,
        history: [{
          type: 'earned',
          points: points,
          description: 'Points added',
          date: new Date()
        }],
      });
    } else {
      account.pointsBalance += points;
      account.history.push({
        type: 'earned',
        points: points,
        description: 'Points added',
        date: new Date()
      });
      account.lastUpdated = new Date();
      await account.save();
    }

    return res.status(200).json({ success: true, data: account, message: `${points} points added!` });
  } catch (error) {
    console.error('Add points error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Purchase redemption points with loyalty points (1:1 ratio)
// @route   POST /api/loyalty/purchase-redemption
// @access  Private
export const purchaseRedemptionPoints = async (req, res) => {
  try {
    const { points } = req.body;

    if (req.user.role !== 'guest') {
      return res.status(403).json({ success: false, message: 'Only guests can purchase redemption points' });
    }

    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: 'Valid number of points is required' });
    }

    const account = await LoyaltyAccount.findOne({ userId: req.user.id });
    
    if (!account) {
      return res.status(404).json({ success: false, message: 'Loyalty account not found. Make a booking to earn points!' });
    }

    if (account.pointsBalance < points) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient loyalty points. You have ${account.pointsBalance} points.`
      });
    }

    // Deduct loyalty points and add redemption points (1:1 ratio)
    account.pointsBalance -= points;
    account.redemptionPointsBalance += points;
    account.history.push({
      type: 'purchase',
      points: points,
      description: `Converted ${points} loyalty points to redemption points`,
      date: new Date()
    });
    account.lastUpdated = new Date();
    await account.save();

    return res.status(200).json({ 
      success: true, 
      data: account, 
      message: `Successfully converted ${points} loyalty points to ${points} redemption points!`
    });
  } catch (error) {
    console.error('Purchase redemption points error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
