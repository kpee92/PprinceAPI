const https = require('https');
const querystring = require('querystring');
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
// const Payment = require('../models/payment')(sequelize, DataTypes);
// const Payment = require('../models/payment')(sequelize, DataTypes);
const Payment = require('../models/payment')(sequelize, DataTypes);
const CryptoTransfer = require('../models/cryptoTransferModel')(sequelize, DataTypes);
const User = require('../models/user')(sequelize, DataTypes);
const Wallet = require('../models/wallet')(sequelize, DataTypes);
// const https = require('https'); // agar blockchain SDK use karoge, replace kar sakte ho
const Web3 = require('web3'); // ya ethers.js, depending on your setup
require('dotenv').config()

/**
 * Query payment status from payment gateway
 * This helps validate if a pre-authorization is still valid before capture
 */
const queryPaymentStatus = async (paymentId) => {
  const entityId = process.env.PAYMENT_ENTITY_ID || '8ac7a4c79394bdc801939736f17e063d';
  const authorization = process.env.PAYMENT_AUTHORIZATION || 'Bearer OGFjN2E0Yzc5Mzk0YmRjODAxOTM5NzM2ZjFhNzA2NDF8enlac1lYckc4QXk6bjYzI1NHNng=';
  const paymentHost = process.env.PAYMENT_HOST || 'eu-test.oppwa.com';

  const path = `/v1/payments/${paymentId}?entityId=${entityId}`;

  const options = {
    port: 443,
    host: paymentHost,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': authorization
    }
  };

  return new Promise((resolve, reject) => {
    const getRequest = https.request(options, function (response) {
      const buf = [];
      response.on('data', chunk => {
        buf.push(Buffer.from(chunk));
      });
      response.on('end', () => {
        const jsonString = Buffer.concat(buf).toString('utf8');
        try {
          const parsedResponse = JSON.parse(jsonString);
          resolve({
            statusCode: response.statusCode,
            data: parsedResponse
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    getRequest.on('error', (error) => {
      reject(new Error(`Payment status query failed: ${error.message}`));
    });
    getRequest.end();
  });
};

/**
 * Pre-authorize payment
 * Accepts payment details from frontend and processes payment through OPP
 */
const preAuthorizePayment = async (req, res) => {
  try {
    const {
      amount,
      currency,
      paymentBrand,
      paymentType,
      card
    } = req.body;

    // Get userId from authenticated user
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required'
      });
    }

    // Validate required fields
    if (!amount || !currency || !paymentBrand) {
      return res.status(400).json({
        error: 'Missing required fields: amount, currency, and paymentBrand are required'
      });
    }

    if (!card || !card.number || !card.holder || !card.expiryMonth || !card.expiryYear || !card.cvv) {
      return res.status(400).json({
        error: 'Missing required card details: number, holder, expiryMonth, expiryYear, and cvv are required'
      });
    }

    // New: Validate Crypto Transfer Details
    // Frontend MUST send the walletAddress user selected from their list
    // const { walletAddress, cryptoCurrency, network } = req.body;

    // if (!cryptoCurrency || !network || !walletAddress) {
    //   return res.status(400).json({
    //     error: 'Missing required crypto transfer fields: walletAddress, cryptoCurrency, and network are required'
    //   });
    // }

    // // SECURITY CHECK: Verify this wallet belongs to the user and matches network
    // console.log(`Verifying wallet ${walletAddress} for user ${userId} on ${network}`);

    // const userWallet = await Wallet.findOne({
    //   where: {
    //     userId: userId,
    //     walletAddress: walletAddress,
    //     network: network
    //   }
    // });

    // if (!userWallet) {
    //   return res.status(400).json({
    //     error: 'Invalid Wallet',
    //     message: 'The selected wallet address does not exist in your account or does not match the selected network.'
    //   });
    // }

    // Force paymentType to 'PA' (Pre-Authorization) for this endpoint
    // This ensures the payment is only authorized, not immediately captured
    const paymentTypeForPreAuth = 'PA';

    // Configuration - consider moving these to environment variables
    // const entityId = process.env.PAYMENT_ENTITY_ID
    // const authorization = process.env.PAYMENT_AUTHORIZATION
    // const paymentHost = process.env.PAYMENT_HOST

    const entityId = process.env.PAYMENT_ENTITY_ID || '8ac7a4c79394bdc801939736f17e063d';
    const authorization = process.env.PAYMENT_AUTHORIZATION || 'Bearer OGFjN2E0Yzc5Mzk0YmRjODAxOTM5NzM2ZjFhNzA2NDF8enlac1lYckc4QXk6bjYzI1NHNng=';
    const paymentHost = process.env.PAYMENT_HOST || 'eu-test.oppwa.com';


    const path = '/v1/payments';
    const data = querystring.stringify({
      'entityId': entityId,
      'amount': amount,
      'currency': currency,
      'paymentBrand': paymentBrand,
      'paymentType': paymentTypeForPreAuth,
      'card.number': card.number,
      'card.holder': card.holder,
      'card.expiryMonth': card.expiryMonth,
      'card.expiryYear': card.expiryYear,
      'card.cvv': card.cvv
    });

    const options = {
      port: 443,
      host: paymentHost,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
        'Authorization': authorization
      }
    };

    // Make the payment request
    const paymentResponse = await new Promise((resolve, reject) => {
      const postRequest = https.request(options, function (response) {
        const buf = [];
        response.on('data', chunk => {
          buf.push(Buffer.from(chunk));
        });
        response.on('end', () => {
          const jsonString = Buffer.concat(buf).toString('utf8');
          try {
            const parsedResponse = JSON.parse(jsonString);
            resolve({
              statusCode: response.statusCode,
              data: parsedResponse
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });
      postRequest.on('error', (error) => {
        reject(new Error(`Payment request failed: ${error.message}`));
      });
      postRequest.write(data);
      postRequest.end();
    });

    // Save payment record to database
    try {
      await Payment.create({
        userId: userId,
        currency: currency,
        amount: amount,
        paymentBrand: paymentBrand,
        paymentType: paymentTypeForPreAuth, // Use 'PA' for pre-authorization
        card: paymentResponse.data.card || null,
        referenceId: paymentResponse.data.id || null, // This is the ID we need for capture
        paymentId: paymentResponse.data.id || null, // Best effort payment ID
        status: 'pending',
        // Crypto Details
        // walletAddress: walletAddress, // Verified address
        // cryptoCurrency: cryptoCurrency,
        // network: network,
        // cryptoAmount: amount // Assuming 1:1 or logic. Update if conversion rate needed.
      });
    } catch (dbError) {
      console.error('Failed to save payment record:', dbError);
      // Continue even if database save fails, but log the error
    }

    // Return the payment response to the frontend
    res.status(paymentResponse.statusCode || 200).json(paymentResponse.data);

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      error: 'Payment processing failed',
      message: error.message
    });
  }
};

/**
 * Capture payment
 * Capture a pre-authorized payment by transferring reserved funds from shopper's account to merchant's account
 */
const capturePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const {
      amount,
      currency
    } = req.body;

    // Validate required fields
    if (!paymentId) {
      return res.status(400).json({
        error: 'Missing required field: paymentId is required in URL parameters'
      });
    }

    if (!amount || !currency) {
      return res.status(400).json({
        error: 'Missing required fields: amount and currency are required'
      });
    }

    // Validate amount format (should be a positive number)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: 'Invalid amount: amount must be a positive number'
      });
    }

    // Try to find the pre-authorization payment record to validate
    // Note: Pre-authorization stores the payment ID in 'referenceId' field, not 'paymentId'
    let preAuthRecord = null;
    try {
      // First try to find by referenceId (where pre-auth stored the payment ID)
      preAuthRecord = await Payment.findOne({
        where: { referenceId: paymentId }
      });

      // If not found, try paymentId field as fallback
      if (!preAuthRecord) {
        preAuthRecord = await Payment.findOne({
          where: { paymentId: paymentId }
        });
      }

      // If found, validate that capture amount doesn't exceed pre-authorized amount
      if (preAuthRecord) {
        const preAuthAmount = parseFloat(preAuthRecord.amount);
        if (amountNum > preAuthAmount) {
          return res.status(400).json({
            error: 'Capture amount exceeds pre-authorized amount',
            message: `Cannot capture ${amount} ${currency}. Pre-authorized amount was ${preAuthRecord.amount} ${preAuthRecord.currency}`,
            preAuthorizedAmount: preAuthRecord.amount,
            preAuthorizedCurrency: preAuthRecord.currency,
            requestedAmount: amount,
            requestedCurrency: currency
          });
        }

        // Check currency match
        if (preAuthRecord.currency !== currency) {
          return res.status(400).json({
            error: 'Currency mismatch',
            message: `Cannot capture in ${currency}. Pre-authorized currency was ${preAuthRecord.currency}`,
            preAuthorizedCurrency: preAuthRecord.currency,
            requestedCurrency: currency
          });
        }

        // Check if already captured
        if (preAuthRecord.status === 'success') {
          return res.status(400).json({
            error: 'Payment already captured',
            message: 'This payment has already been successfully captured',
            paymentId: paymentId
          });
        }

        // Check if pre-authorization failed
        if (preAuthRecord.status === 'failed') {
          return res.status(400).json({
            error: 'Pre-authorization failed',
            message: 'Cannot capture a payment that was not successfully pre-authorized',
            paymentId: paymentId
          });
        }
      } else {
        // Payment record not found - log warning but continue (might be from external system)
        console.warn(`Pre-authorization record not found for paymentId: ${paymentId}`);
      }
    } catch (dbError) {
      console.warn('Could not validate pre-authorization record:', dbError);
      // Continue with capture attempt even if we can't find the record
    }

    // Optional: Query payment gateway to check pre-authorization status before capture
    // This helps identify issues before attempting capture
    let preAuthStatus = null;
    try {
      const statusResponse = await queryPaymentStatus(paymentId);
      preAuthStatus = statusResponse.data;

      // Check if pre-authorization result indicates it's not capturable
      const statusResultCode = preAuthStatus.result?.code || '';
      if (statusResultCode && !statusResultCode.startsWith('000')) {
        return res.status(400).json({
          error: 'Pre-authorization is not valid for capture',
          message: `Pre-authorization status check failed: ${preAuthStatus.result?.description || 'Unknown error'}`,
          code: statusResultCode,
          preAuthStatus: preAuthStatus,
          troubleshooting: {
            possibleCauses: [
              'Pre-authorization was reverted or expired',
              'Pre-authorization was already captured',
              'Pre-authorization failed'
            ],
            suggestions: [
              'Check the pre-authorization status in the payment gateway',
              'Create a new pre-authorization if this one is no longer valid',
              'Verify the payment ID is correct'
            ]
          }
        });
      }

      // Check if payment type indicates it's already captured
      if (preAuthStatus.paymentType && preAuthStatus.paymentType !== 'PA' && preAuthStatus.paymentType !== 'DB') {
        return res.status(400).json({
          error: 'Payment already processed',
          message: `This payment has already been processed. Payment type: ${preAuthStatus.paymentType}`,
          preAuthStatus: preAuthStatus
        });
      }

      // Validate amount if available in status
      if (preAuthStatus.amount) {
        const preAuthAmount = parseFloat(preAuthStatus.amount);
        if (amountNum > preAuthAmount) {
          return res.status(400).json({
            error: 'Capture amount exceeds pre-authorized amount',
            message: `Cannot capture ${amount} ${currency}. Pre-authorized amount was ${preAuthStatus.amount} ${preAuthStatus.currency || currency}`,
            preAuthorizedAmount: preAuthStatus.amount,
            preAuthorizedCurrency: preAuthStatus.currency || currency,
            requestedAmount: amount,
            requestedCurrency: currency
          });
        }
      }
    } catch (statusError) {
      // Log but don't fail - continue with capture attempt
      console.warn('Could not query pre-authorization status:', statusError.message);
      // Continue with capture attempt even if status query fails
    }

    // Configuration - consider moving these to environment variables
    // const entityId = process.env.PAYMENT_ENTITY_ID
    // const authorization = process.env.PAYMENT_AUTHORIZATION
    // const paymentHost = process.env.PAYMENT_HOST
    const entityId = process.env.PAYMENT_ENTITY_ID || '8ac7a4c79394bdc801939736f17e063d';
    const authorization = process.env.PAYMENT_AUTHORIZATION || 'Bearer OGFjN2E0Yzc5Mzk0YmRjODAxOTM5NzM2ZjFhNzA2NDF8enlac1lYckc4QXk6bjYzI1NHNng=';
    const paymentHost = process.env.PAYMENT_HOST || 'eu-test.oppwa.com';


    const path = `/v1/payments/${paymentId}`;
    const data = querystring.stringify({
      'entityId': entityId,
      'amount': amount,
      'paymentType': 'CP',
      'currency': currency
    });

    const options = {
      port: 443,
      host: paymentHost,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
        'Authorization': authorization
      }
    };

    // Make the capture payment request
    const paymentResponse = await new Promise((resolve, reject) => {
      const postRequest = https.request(options, function (response) {
        const buf = [];
        response.on('data', chunk => {
          buf.push(Buffer.from(chunk));
        });
        response.on('end', () => {
          const jsonString = Buffer.concat(buf).toString('utf8');
          try {
            const parsedResponse = JSON.parse(jsonString);
            resolve({
              statusCode: response.statusCode,
              data: parsedResponse
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });
      postRequest.on('error', (error) => {
        reject(new Error(`Payment capture request failed: ${error.message}`));
      });
      postRequest.write(data);
      postRequest.end();
    });

    // Check for payment gateway errors
    const resultCode = paymentResponse.data.result?.code || '';
    const resultDescription = paymentResponse.data.result?.description || '';
    const isSuccess = resultCode.startsWith('000');

    // Provide helpful error messages for common error codes
    let errorMessage = resultDescription;
    if (resultCode === '700.400.100') {
      errorMessage = 'Cannot capture payment. The pre-authorization may have been reverted, expired, or the capture amount exceeds the pre-authorized amount. Please check the pre-authorization status and try again.';
    } else if (resultCode.startsWith('700')) {
      errorMessage = `Payment gateway error: ${resultDescription}. Please verify the pre-authorization is still valid and try again.`;
    }

    // Update payment record in database
    try {
      // Try to find payment record by referenceId first (where pre-auth stores the payment ID)
      let paymentRecord = await Payment.findOne({
        where: { referenceId: paymentId }
      });

      // If not found, try paymentId field
      if (!paymentRecord) {
        paymentRecord = await Payment.findOne({
          where: { paymentId: paymentId }
        });
      }

      // If still not found, try using referencedId from response
      if (!paymentRecord) {
        const referencedId = paymentResponse.data.referencedId || paymentResponse.data.referenceId;
        if (referencedId) {
          paymentRecord = await Payment.findOne({
            where: { referenceId: referencedId }
          });
          if (!paymentRecord) {
            paymentRecord = await Payment.findOne({
              where: { paymentId: referencedId }
            });
          }
        }
      }

      if (paymentRecord) {
        // Determine status based on result code
        const newStatus = isSuccess ? 'success' : 'failed';

        // Update the payment record
        await paymentRecord.update({
          paymentId: paymentResponse.data.id || paymentRecord.paymentId, // Update with new payment ID from capture
          referenceId: paymentResponse.data.referencedId || paymentResponse.data.referenceId || paymentId, // Store the referenced ID
          status: newStatus
        });
      } else {
        console.warn(`Payment record not found for paymentId: ${paymentId}`);
      }
    } catch (dbError) {
      console.error('Failed to update payment record:', dbError);
      // Continue even if database update fails, but log the error
    }

    // Return appropriate response based on success/failure
    if (isSuccess) {
      // Success response
      res.status(paymentResponse.statusCode || 200).json(paymentResponse.data);
    } else {
      // Error response - return 400 Bad Request for payment gateway errors
      res.status(400).json({
        error: 'Payment capture failed',
        message: errorMessage || resultDescription || 'Unable to capture payment',
        code: resultCode,
        details: paymentResponse.data,
        troubleshooting: resultCode === '700.400.100' ? {
          possibleCauses: [
            'Pre-authorization was reverted or expired',
            'Capture amount exceeds pre-authorized amount',
            'Pre-authorization was already captured',
            'Invalid payment workflow'
          ],
          suggestions: [
            'Verify the pre-authorization is still valid',
            'Check that the capture amount does not exceed the pre-authorized amount',
            'Ensure the pre-authorization has not been captured already',
            'Try creating a new pre-authorization if this one has expired'
          ]
        } : undefined
      });
    }

  } catch (error) {
    console.error('Payment capture error:', error);
    res.status(500).json({
      error: 'Payment capture failed',
      message: error.message
    });
  }
};

/**
 * Manage payment
 * Initiate back-office operations on a captured payment (refund, rebill, chargeback, chargeback reversal)
 */
const managePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const {
      operation,
      amount,
      currency
    } = req.body;

    // Validate required fields
    if (!paymentId) {
      return res.status(400).json({
        error: 'Missing required field: paymentId is required in URL parameters'
      });
    }

    if (!operation || !amount || !currency) {
      return res.status(400).json({
        error: 'Missing required fields: operation, amount, and currency are required'
      });
    }

    // Map operation to paymentType
    const operationMap = {
      'refund': 'RF',
      'rebill': 'RB',
      'chargeback': 'CB',
      'chargeback reversal': 'CB_RV'
    };

    const paymentType = operationMap[operation.toLowerCase()];
    if (!paymentType) {
      return res.status(400).json({
        error: 'Invalid operation. Allowed operations: refund, rebill, chargeback, chargeback reversal'
      });
    }

    // Configuration - consider moving these to environment variables
    const entityId = process.env.PAYMENT_ENTITY_ID || '8ac7a4c79394bdc801939736f17e063d';
    const authorization = process.env.PAYMENT_AUTHORIZATION || 'Bearer OGFjN2E0Yzc5Mzk0YmRjODAxOTM5NzM2ZjFhNzA2NDF8enlac1lYckc4QXk6bjYzI1NHNng=';
    const paymentHost = process.env.PAYMENT_HOST || 'eu-test.oppwa.com';

    const path = `/v1/payments/${paymentId}`;
    const data = querystring.stringify({
      'entityId': entityId,
      'amount': amount,
      'paymentType': paymentType,
      'currency': currency
    });

    const options = {
      port: 443,
      host: paymentHost,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
        'Authorization': authorization
      }
    };

    // Make the manage payment request
    const paymentResponse = await new Promise((resolve, reject) => {
      const postRequest = https.request(options, function (response) {
        const buf = [];
        response.on('data', chunk => {
          buf.push(Buffer.from(chunk));
        });
        response.on('end', () => {
          const jsonString = Buffer.concat(buf).toString('utf8');
          try {
            const parsedResponse = JSON.parse(jsonString);
            resolve({
              statusCode: response.statusCode,
              data: parsedResponse
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });
      postRequest.on('error', (error) => {
        reject(new Error(`Payment management request failed: ${error.message}`));
      });
      postRequest.write(data);
      postRequest.end();
    });

    // Update payment record in database if operation is successful
    try {
      const resultCode = paymentResponse.data.result?.code || '';
      const isSuccess = resultCode.startsWith('000');

      if (isSuccess) {
        // Get referencedId from response (this is the original payment ID)
        const referencedId = paymentResponse.data.referencedId || paymentResponse.data.referenceId;

        // Use referencedId to find the payment record, fallback to paymentId from URL if not found
        const searchId = referencedId || paymentId;

        const paymentRecord = await Payment.findOne({
          where: { paymentId: searchId }
        });

        if (paymentRecord) {
          // Update status based on operation
          let newStatus = paymentRecord.status;
          if (operation.toLowerCase() === 'refund') {
            newStatus = 'refunded';
          } else if (operation.toLowerCase() === 'chargeback') {
            newStatus = 'chargeback';
          } else if (operation.toLowerCase() === 'chargeback reversal') {
            newStatus = 'chargeback_reversed';
          }
          // For rebill, status might remain 'success' or could be updated based on business logic

          await paymentRecord.update({
            status: newStatus
          });
        } else {
          console.warn(`Payment record not found for paymentId: ${searchId}`);
        }
      }
    } catch (dbError) {
      console.error('Failed to update payment record:', dbError);
      // Continue even if database update fails, but log the error
    }

    // Return the payment response to the frontend
    res.status(paymentResponse.statusCode || 200).json(paymentResponse.data);

  } catch (error) {
    console.error('Payment management error:', error);
    res.status(500).json({
      error: 'Payment management failed',
      message: error.message
    });
  }
};

/**
 * Get user payment history
 * Fetch all payment records for the authenticated user
 */
const userPaymentHistory = async (req, res) => {
  try {
    // Get userId from authenticated user
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      console.error('No userId found in token:', req.user);
      return res.status(401).json({
        error: 'User authentication required',
        message: 'User ID not found in authentication token'
      });
    }

    console.log('Fetching payment history for userId:', userId);

    // Optional query parameters for filtering
    const { status, limit, offset } = req.query;

    // Build where clause
    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    console.log('Query where clause:', whereClause);

    // Build query options
    const queryOptions = {
      where: whereClause,
      order: [['createdAt', 'DESC']], // Newest first
    };

    // Add pagination if provided
    if (limit) {
      queryOptions.limit = parseInt(limit, 10);
    }
    if (offset) {
      queryOptions.offset = parseInt(offset, 10);
    }

    // Fetch payments from database
    const payments = await Payment.findAll(queryOptions);

    console.log(`Found ${payments.length} payment(s) for userId: ${userId}`);
    if (payments.length > 0) {
      console.log('Sample payment userId:', payments[0].userId);
      console.log('Sample payment id:', payments[0].id);
    }

    // Get total count for pagination info
    const totalCount = await Payment.count({ where: whereClause });

    console.log(`Total count: ${totalCount}`);

    // Also check all payments in database for debugging (remove in production)
    const allPayments = await Payment.findAll({
      attributes: ['id', 'userId', 'amount', 'status', 'createdAt'],
      limit: 10
    });
    console.log('All payments in database (first 10):', JSON.stringify(allPayments, null, 2));

    // Return payment history
    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total: totalCount,
        limit: queryOptions.limit || totalCount,
        offset: queryOptions.offset || 0,
        count: payments.length
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      error: 'Failed to fetch payment history',
      message: error.message
    });
  }
};


// Admin wallet config
const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

// Network RPC URLs - EXPANDED
const NETWORK_RPC = {
  // Mainnets
  BSC: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org/',
  ETH: process.env.ETH_RPC || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY', // CHANGE THIS
  POLYGON: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  AVALANCHE: process.env.AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc',
  ARBITRUM: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
  OPTIMISM: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
  BASE: process.env.BASE_RPC || 'https://mainnet.base.org',
  FANTOM: process.env.FANTOM_RPC || 'https://rpc.ftm.tools',
  CRONOS: process.env.CRONOS_RPC || 'https://evm.cronos.org',

  // Testnets
  BSC_TESTNET: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  SEPOLIA: 'https://rpc.sepolia.org',
  MUMBAI: 'https://rpc-mumbai.maticvigil.com'
};

// Token Decimals Config (Important for USDT/USDC)
const TOKEN_DECIMALS = {
  USDT: 6,
  USDC: 6,
  DAI: 18,
  BUSD: 18,
  // Add other tokens here. Default will be 18 if not found.
};

// Token Contract Addresses
// IMPORTANT: You must fill these with REAL addresses for each network
const TOKEN_CONTRACTS = {
  BSC: {
    USDT: '0x55d398326f99059fF775485246999027B3197955', // Mainnet
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    // BUSD: '...'
  },
  ETH: {
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  },
  POLYGON: {
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' // Native USDC (Pos)
    // Old USDC (Bridged): 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
  },
  // Add addresses for other networks...
};

// Standard ERC20 ABI (Minimal for transfer)
const ERC20_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
];

/**
 * Transfer Crypto Function (Internal)
 * Supports Native (ETH/BNB) and ERC20 Tokens (USDT/USDC)
 */
const transferCrypto = async (userId, paymentId, amount, currency, walletAddress, network) => {
  console.log(`Starting crypto transfer: ${amount} ${currency} to ${walletAddress} on ${network}`);

  try {
    // 1️⃣ Validate Inputs
    if (!walletAddress || !amount || !network) {
      throw new Error('Missing transfer details');
    }

    if (!NETWORK_RPC[network]) {
      throw new Error(`Unsupported network: ${network}`);
    }

    // 2️⃣ Check if already transferred
    const existingTransfer = await CryptoTransfer.findOne({ where: { paymentId: paymentId, status: 'success' } });
    if (existingTransfer) {
      console.log('Crypto already transferred for this payment.');
      return { success: true, txHash: existingTransfer.txHash, message: 'Already transferred' };
    }

    // 3️⃣ Setup Web3
    const web3 = new Web3(new Web3.providers.HttpProvider(NETWORK_RPC[network]));

    // Safety check: is Admin address set?
    if (!ADMIN_WALLET_ADDRESS || !ADMIN_PRIVATE_KEY) {
      throw new Error('Admin wallet configuration missing');
    }

    // Get current gas price
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(ADMIN_WALLET_ADDRESS, 'latest');

    let receipt;

    // 4️⃣ Determine Native vs Token Transfer
    const nativeCurrencies = ['ETH', 'BNB', 'MATIC', 'AVAX', 'FTM', 'CRO']; // Add native symbols
    const isNative = nativeCurrencies.includes(currency);

    if (isNative) {
      // --- NATIVE COIN TRANSFER ---
      const valueInWei = web3.utils.toWei(amount.toString(), 'ether');

      const tx = {
        from: ADMIN_WALLET_ADDRESS,
        to: walletAddress,
        value: valueInWei,
        gas: 21000,
        gasPrice: gasPrice,
        nonce: nonce
      };

      const signedTx = await web3.eth.accounts.signTransaction(tx, ADMIN_PRIVATE_KEY);
      receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    } else {
      // --- TOKEN TRANSFER (ERC20) ---
      // Verify we have the contract address
      const contractAddress = TOKEN_CONTRACTS[network] ? TOKEN_CONTRACTS[network][currency] : null;

      if (!contractAddress) {
        throw new Error(`Token contract not configured for ${currency} on ${network}`);
      }

      const contract = new web3.eth.Contract(ERC20_ABI, contractAddress);

      // Handle Decimals (USDT/USDC = 6, others = 18 usually)
      const decimals = TOKEN_DECIMALS[currency] || 18;

      // Calculate amount manually based on decimals to avoid scientific notation issues
      // approach: amount * (10^decimals)
      // Safest way is using library or string manipulation for precision, 
      // but for standard float amounts, this is usually acceptable:
      // (Better approach uses ethers.parseUnits equivalents, but sticking to web3.js + BN pattern if needed, or simple math for now)

      let amountToSend;
      if (decimals === 18) {
        amountToSend = web3.utils.toWei(amount.toString(), 'ether');
      } else if (decimals === 6) {
        amountToSend = web3.utils.toWei(amount.toString(), 'mwei'); // mwei is 10^6
      } else {
        // Fallback manual calc if web3.utils doesn't support that specific unit name
        // This is a simple calculation
        amountToSend = (parseFloat(amount) * Math.pow(10, decimals)).toFixed(0);
      }

      console.log(`Sending Token Amount (Raw): ${amountToSend} (Decimals: ${decimals})`);

      const data = contract.methods.transfer(walletAddress, amountToSend).encodeABI();

      // Estimate gas for token transfer
      let gasLimit;
      try {
        gasLimit = await contract.methods.transfer(walletAddress, amountToSend).estimateGas({ from: ADMIN_WALLET_ADDRESS });
      } catch (e) {
        console.warn('Gas estimation failed, using fallback', e);
        gasLimit = 65000; // Fallback safe limit
      }

      const tx = {
        from: ADMIN_WALLET_ADDRESS,
        to: contractAddress,
        data: data,
        gas: gasLimit,
        gasPrice: gasPrice,
        nonce: nonce
      };

      const signedTx = await web3.eth.accounts.signTransaction(tx, ADMIN_PRIVATE_KEY);
      receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    console.log('Transaction successful with hash:', receipt.transactionHash);

    // 5️⃣ Save Transfer Record
    await CryptoTransfer.create({
      userId: userId,
      paymentId: paymentId,
      cryptoAmount: amount,
      cryptoCurrency: currency,
      walletAddress: walletAddress,
      fromWalletAddress: ADMIN_WALLET_ADDRESS,
      network: network,
      txHash: receipt.transactionHash,
      status: 'success',
      isProcessed: true
    });

    // 6️⃣ Update Payment Record
    await Payment.update({ transferStatus: 'success' }, { where: { id: paymentId } });

    return { success: true, txHash: receipt.transactionHash };

  } catch (error) {
    console.error('Crypto transfer failed:', error);

    await CryptoTransfer.create({
      userId: userId,
      paymentId: paymentId,
      cryptoAmount: amount,
      cryptoCurrency: currency,
      walletAddress: walletAddress,
      fromWalletAddress: ADMIN_WALLET_ADDRESS || 'admin',
      network: network,
      status: 'failed',
      isProcessed: false
    });

    await Payment.update({ transferStatus: 'failed' }, { where: { id: paymentId } });

    return { success: false, error: error.message };
  }
};

//=====================WEBHOOK
/**
 * Setopay Webhook Handler
 * Receives notification from Setopay -> Captures Payment -> Triggers Crypto Transfer
 */
const handleSetopayWebhook = async (req, res) => {
  try {
    const payload = req.body;
    console.log('🔔 Webhook received:', JSON.stringify(payload, null, 2));

    // The payload structure depends on Setopay's webhook format.
    // Usually it sends the `id` (paymentId) and `result` object.
    // Or sometimes it's an event based structure.
    // Assuming standard OPPWA async notification:
    // It sends transaction details.

    // 1️⃣ Extract ID and Status
    const paymentId = payload.id;
    const resultCode = payload.result ? payload.result.code : null;

    if (!paymentId) {
      console.warn('Webhook missing paymentId');
      return res.status(400).send('Missing paymentId');
    }

    // 2️⃣ Find the Payment Record
    // We search by `referenceId` (which we stored as paymentId during pre-auth) OR `paymentId`
    let payment = await Payment.findOne({ where: { referenceId: paymentId } });

    if (!payment) {
      payment = await Payment.findOne({ where: { paymentId: paymentId } });
    }

    if (!payment) {
      console.warn(`Payment record not found for webhook ID: ${paymentId}`);
      // Return 200 to acknowledge webhook so they stop sending retries, even if we can't process it
      return res.status(200).send('Payment not found locally');
    }

    // 3️⃣ Check duplicates
    if (payment.status === 'success' && payment.transferStatus === 'success') {
      return res.status(200).send('Already fully processed');
    }

    // 4️⃣ Verify Success Code (Starts with 000)
    const isSuccess = resultCode && /^(000\.000\.|000\.100\.1|000\.[36])/.test(resultCode);

    if (isSuccess) {
      // Payment Authorized/Success at Gateway

      // 5️⃣ Update Local Status to 'authorized' if it was pending
      if (payment.status !== 'success') {
        await payment.update({ status: 'authorized' });
      }

      // 6️⃣ CAPTURE PAYMENT (If it was Pre-Auth "PA")
      // NOTE: If Setopay webhook says "000.000.000" (Transaction Succeeded), it might already be captured if we sent "DB" (Debit) type.
      // But we sent "PA". So we MUST Capture.

      console.log(`Attempting to capture payment ${payment.id}...`);

      // Configuration
      const entityId = process.env.PAYMENT_ENTITY_ID;
      const authorization = process.env.PAYMENT_AUTHORIZATION;
      const paymentHost = process.env.PAYMENT_HOST;

      const data = querystring.stringify({
        entityId: entityId,
        amount: payment.amount,
        currency: payment.currency,
        paymentType: 'CP'
      });

      const options = {
        port: 443,
        host: paymentHost,
        path: `/v1/payments/${paymentId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length,
          'Authorization': authorization
        }
      };

      // Execute Capture
      try {
        const captureResponse = await new Promise((resolve, reject) => {
          const reqCapture = https.request(options, (response) => {
            const buf = [];
            response.on('data', d => buf.push(d));
            response.on('end', () => resolve(JSON.parse(Buffer.concat(buf).toString())));
          });
          reqCapture.on('error', reject);
          reqCapture.write(data);
          reqCapture.end();
        });

        const captureCode = captureResponse.result ? captureResponse.result.code : '';

        if (/^(000\.000\.|000\.100\.1|000\.[36])/.test(captureCode)) {
          console.log('Capture Successful!');
          await payment.update({ status: 'success', paymentId: captureResponse.id }); // Update with Capture ID if needed

          // 7️⃣ TRIGGER CRYPTO TRANSFER
          if (payment.walletAddress && payment.cryptoCurrency && payment.network) {
            const transferResult = await transferCrypto(
              payment.userId,
              payment.id,
              payment.cryptoAmount || payment.amount, // fallback if cryptoAmount not set
              payment.cryptoCurrency,
              payment.walletAddress,
              payment.network
            );

            if (transferResult.success) {
              console.log('Crypto Transfer Complete');
            } else {
              console.error('Crypto Transfer Error:', transferResult.error);
            }
          } else {
            console.warn('Skipping crypto transfer: Missing wallet details');
          }

        } else {
          console.error('Capture Failed Code:', captureCode);
          await payment.update({ status: 'failed_capture', paymentId: captureResponse.id });
        }

      } catch (captureErr) {
        console.error('Capture Request Error:', captureErr);
        await payment.update({ status: 'error_capture' });
      }

    } else {
      console.log('Webhook indicated failure or pending:', resultCode);
      // Handle failure status update if needed
    }

    return res.status(200).send('Webhook processed');

  } catch (error) {
    console.error('Webhook critical error:', error);
    return res.status(500).send('Internal Server Error');
  }
};


// exports.handleSetopayWebhook = async (req, res) => {
//   try {
//     const payload = req.body;

//     console.log('🔔 Webhook received:', payload);

//     // 1️⃣ Event check
//     if (payload.event !== 'payment.success') {
//       return res.status(200).send('Event ignored');
//     }

//     const paymentId = payload.paymentId;

//     // 2️⃣ Payment record find karo
//     const payment = await Payment.findOne({
//       where: { referenceId: paymentId }
//     });

//     if (!payment) {
//       console.warn('Payment not found:', paymentId);
//       return res.status(200).send('Payment not found');
//     }

//     // 3️⃣ Duplicate webhook protection
//     if (payment.status === 'success') {
//       return res.status(200).send('Already processed');
//     }

//     // 4️⃣ Mark authorized
//     await payment.update({ status: 'authorized' });

//     // 5️⃣ Capture payment (REAL MONEY CUT)
//     const captureResult = await capturePaymentInternal({
//       paymentId,
//       amount: payment.amount,
//       currency: payment.currency
//     });

//     if (!captureResult.success) {
//       await payment.update({ status: 'failed' });
//       return res.status(200).send('Capture failed');
//     }

//     // 6️⃣ Mark success
//     await payment.update({ status: 'success' });

//     // 7️⃣ (OPTIONAL) Crypto transfer yahan call karo
//     // await transferCryptoToUser(payment.userId, payment.amount);

//     return res.status(200).send('OK');

//   } catch (error) {
//     console.error('Webhook error:', error);
//     return res.status(500).send('Webhook error');
//   }
// };

/**
 * Webhook handler: Payment success → Capture payment
 * This is the ONLY place where capture happens
//  */
// const setopayWebhookAndCapture = async (req, res) => {
//   try {
//     const payload = req.body;

//     console.log('Setopay Webhook:', payload);

//     // 1️⃣ Basic validation
//     if (payload.event !== 'payment.success') {
//       return res.status(200).send('Ignored');
//     }

//     const paymentId = payload.paymentId;
//     if (!paymentId) {
//       return res.status(400).send('PaymentId missing');
//     }

//     // 2️⃣ Find payment in DB (created during preAuthorizePayment)
//     const payment = await Payment.findOne({
//       where: { referenceId: paymentId }
//     });

//     if (!payment) {
//       return res.status(200).send('Payment not found');
//     }

//     // 3️⃣ Avoid duplicate processing (VERY IMPORTANT)
//     if (payment.status === 'success') {
//       return res.status(200).send('Already processed');
//     }

//     // 4️⃣ CALL SETOPAY CAPTURE (CP)
//     const entityId = process.env.PAYMENT_ENTITY_ID;
//     const authorization = process.env.PAYMENT_AUTHORIZATION;
//     const paymentHost = process.env.PAYMENT_HOST;

//     const data = querystring.stringify({
//       entityId,
//       amount: payment.amount,
//       currency: payment.currency,
//       paymentType: 'CP'
//     });

//     const options = {
//       host: paymentHost,
//       port: 443,
//       path: `/v1/payments/${paymentId}`,
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'Content-Length': data.length,
//         Authorization: authorization
//       }
//     };

//     const captureResponse = await new Promise((resolve, reject) => {
//       const reqCapture = https.request(options, (response) => {
//         const buf = [];
//         response.on('data', d => buf.push(d));
//         response.on('end', () => {
//           resolve(JSON.parse(Buffer.concat(buf).toString()));
//         });
//       });

//       reqCapture.on('error', reject);
//       reqCapture.write(data);
//       reqCapture.end();
//     });

//     const resultCode = captureResponse?.result?.code || '';

//     if (!resultCode.startsWith('000')) {
//       return res.status(400).json({
//         error: 'Capture failed',
//         details: captureResponse
//       });
//     }

//     // 5️⃣ Update DB
//     await payment.update({
//       status: 'success',
//       paymentId: captureResponse.id
//     });

//     // 6️⃣ OPTIONAL: Crypto transfer trigger
//     // await transferCryptoToUser(payment.userId, payment.amount);

//     return res.status(200).send('Payment captured successfully');

//   } catch (err) {
//     console.error('Webhook Capture Error:', err);
//     return res.status(500).send('Internal error');
//   }
// };


module.exports = {
  preAuthorizePayment,
  capturePayment,
  managePayment,
  userPaymentHistory,
  handleSetopayWebhook // Exporting the new webhook handler
};
